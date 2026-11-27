import fs from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  THREADS_AUTHORIZE_URL,
  THREADS_OAUTH_SCOPES,
  THREADS_TOKEN_URL,
  buildThreadsAuthorizeUrl,
  buildThreadsConnectionConfig,
  buildThreadsLongLivedTokenUrl,
  buildThreadsProfileUrl,
  buildThreadsRefreshLongLivedTokenUrl,
  buildThreadsTokenExchangeBody,
  inspectThreadsConnectionReadiness,
  isThreadsTokenExpired,
  normalizeThreadsAuthCode,
  parseThreadsLongLivedTokenResponse,
  parseThreadsTokenExchangeResponse,
  readThreadsEnv,
  validateThreadsOAuthState,
} from "../../lib/social/threads-oauth"
import {
  buildThreadsContainerUrl,
  buildThreadsPublicUrl,
  buildThreadsPublishUrl,
  publishApprovedThreadsPost,
  type ThreadsPublishStore,
} from "../../lib/social/threads-publish"
import { getPlatformCapabilities } from "../../lib/platform/execution/provider-contracts/social-provider"
import { canonicalArticleUrl } from "../../lib/social/x-publish-policy"

const cwd = process.cwd()
const CANONICAL = canonicalArticleUrl("sample-slug")

function makeStore(overrides: {
  post?: Record<string, unknown> | null
  integration?: Record<string, unknown> | null
}): {
  store: ThreadsPublishStore
  updates: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
} {
  const updates: Array<Record<string, unknown>> = []
  const events: Array<Record<string, unknown>> = []
  const post =
    overrides.post === undefined
      ? {
          id: "threads-1",
          platform: "threads",
          content: `Vision for ordinary days.\n${CANONICAL}`,
          status: "approved",
          externalId: null,
          articleId: "article-1",
          article: {
            id: "article-1",
            status: "published",
            slug: "sample-slug",
          },
        }
      : overrides.post

  const integration =
    overrides.integration === undefined
      ? {
          name: "Threads",
          enabled: true,
          status: "connected",
          config: {
            accessToken: "test-access-token",
            userId: "user-123",
            username: "echoesvisions",
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        }
      : overrides.integration

  const store: ThreadsPublishStore = {
    socialPost: {
      findUnique: vi.fn(async () => post as never),
      update: vi.fn(async ({ data }) => {
        updates.push(data)
        return { ...(post as object), ...data } as never
      }),
    },
    externalIntegration: {
      findUnique: vi.fn(async () => integration as never),
    },
    operationalEvent: {
      create: vi.fn(async ({ data }) => {
        events.push(data)
        return data
      }),
    },
  }

  return { store, updates, events }
}

describe("EV-OPS-04 R2 — Threads recovery readiness", () => {
  describe("recovered source paths", () => {
    it("restores OAuth authorize/callback/status routes", () => {
      for (const rel of [
        "app/api/social/oauth/threads/authorize/route.ts",
        "app/api/social/oauth/threads/callback/route.ts",
        "app/api/social/oauth/threads/status/route.ts",
        "app/api/social/publish/threads/route.ts",
        "lib/social/threads-oauth.ts",
        "lib/social/threads-publish.ts",
      ]) {
        expect(fs.existsSync(path.join(cwd, rel))).toBe(true)
      }
    })

    it("marks Threads publish-capable in provider contract", () => {
      const cap = getPlatformCapabilities("threads")
      expect(cap.textPublishing).toBe(true)
      expect(cap.publishStatus).toBe("publish_capable")
      expect(cap.draftGeneration).toBe(true)
    })

    it("does not add threads to Production distribution-scope yet", () => {
      const src = fs.readFileSync(
        path.join(cwd, "lib/publishing/distribution-scope.ts"),
        "utf8",
      )
      expect(src).toMatch(/DistributionChannel = "x" \| "newsletter" \| "linkedin"/)
      expect(src).not.toMatch(/"threads"/)
    })
  })

  describe("OAuth helpers and credential protection", () => {
    it("builds authorize URL with required scopes and state", () => {
      const url = buildThreadsAuthorizeUrl({
        appId: "app-id",
        redirectUri: "https://www.echoesandvisions.com/api/social/oauth/threads/callback",
        state: "abc123",
      })
      expect(url.startsWith(THREADS_AUTHORIZE_URL)).toBe(true)
      expect(url).toContain("client_id=app-id")
      expect(url).toContain("state=abc123")
      expect(url).toContain(encodeURIComponent(THREADS_OAUTH_SCOPES.join(",")))
      expect(url).not.toMatch(/app.secret|APP_SECRET|client_secret/i)
    })

    it("validates OAuth state and rejects mismatches", () => {
      expect(
        validateThreadsOAuthState({ state: "a", cookieState: "a" }).ok,
      ).toBe(true)
      expect(
        validateThreadsOAuthState({ state: "a", cookieState: "b" }).ok,
      ).toBe(false)
      expect(
        validateThreadsOAuthState({ state: null, cookieState: "a" }).ok,
      ).toBe(false)
    })

    it("normalizes Meta #_ suffix on auth codes", () => {
      expect(normalizeThreadsAuthCode("CODE123#_")).toBe("CODE123")
    })

    it("builds token exchange body without leaking into authorize URL", () => {
      const body = buildThreadsTokenExchangeBody({
        appId: "id",
        appSecret: "secret-value",
        redirectUri: "https://example.com/cb",
        code: "CODE#_",
      })
      expect(body.get("grant_type")).toBe("authorization_code")
      expect(body.get("code")).toBe("CODE")
      expect(body.get("client_secret")).toBe("secret-value")
      expect(THREADS_TOKEN_URL).toContain("graph.threads.net")
    })

    it("builds long-lived exchange and refresh URLs", () => {
      const exchange = buildThreadsLongLivedTokenUrl({
        appSecret: "secret",
        shortLivedAccessToken: "short",
      })
      expect(exchange).toContain("grant_type=th_exchange_token")
      expect(exchange).not.toContain("authorization_code")

      const refresh = buildThreadsRefreshLongLivedTokenUrl({
        longLivedAccessToken: "long",
      })
      expect(refresh).toContain("grant_type=th_refresh_token")
    })

    it("parses token and profile helpers", () => {
      expect(
        parseThreadsTokenExchangeResponse({
          access_token: "tok",
          user_id: 99,
        }),
      ).toEqual({ accessToken: "tok", userId: "99" })
      expect(
        parseThreadsLongLivedTokenResponse({
          access_token: "long",
          expires_in: 100,
          token_type: "bearer",
        })?.expiresIn,
      ).toBe(100)
      expect(buildThreadsProfileUrl("tok")).toContain("/me?")
      expect(buildThreadsPublicUrl({ username: "u", mediaId: "m" })).toBe(
        "https://www.threads.net/@u/post/m",
      )
    })

    it("reports connection readiness without token values", () => {
      const ready = inspectThreadsConnectionReadiness({
        envConfigured: true,
        integrationEnabled: true,
        config: buildThreadsConnectionConfig({
          accessToken: "tok",
          userId: "1",
          username: "u",
          expiresInSeconds: 3600,
        }),
      })
      expect(ready.connected).toBe(true)
      expect(ready.status).toBe("connected")
      expect(JSON.stringify(ready)).not.toContain("tok")

      expect(
        inspectThreadsConnectionReadiness({
          envConfigured: true,
          integrationEnabled: true,
          config: {
            accessToken: "tok",
            userId: "1",
            expiresAt: new Date(Date.now() - 1000).toISOString(),
          },
        }).status,
      ).toBe("token_expired")
      expect(isThreadsTokenExpired(new Date(Date.now() - 1).toISOString())).toBe(
        true,
      )
    })

    it("detects missing env names only", () => {
      const missing = readThreadsEnv({} as NodeJS.ProcessEnv)
      expect(missing.ok).toBe(false)
      if (!missing.ok) {
        expect(missing.missing).toEqual([
          "THREADS_APP_ID",
          "THREADS_APP_SECRET",
          "THREADS_REDIRECT_URI",
        ])
      }
    })
  })

  describe("governed publication with mocked provider", () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchMock = vi.fn()
    })

    it("rejects unapproved posts", async () => {
      const { store, events } = makeStore({
        post: {
          id: "threads-1",
          platform: "threads",
          content: `x\n${CANONICAL}`,
          status: "review-required",
          externalId: null,
          articleId: "article-1",
          article: { id: "article-1", status: "published", slug: "sample-slug" },
        },
      })
      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(403)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(events).toHaveLength(0)
    })

    it("rejects unpublished articles", async () => {
      const { store } = makeStore({
        post: {
          id: "threads-1",
          platform: "threads",
          content: `x\n${CANONICAL}`,
          status: "approved",
          externalId: null,
          articleId: "article-1",
          article: { id: "article-1", status: "scheduled", slug: "sample-slug" },
        },
      })
      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(403)
      expect(result.body.error).toMatch(/published/i)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("enforces canonical article URL", async () => {
      const { store } = makeStore({
        post: {
          id: "threads-1",
          platform: "threads",
          content: "Missing link",
          status: "approved",
          externalId: null,
          articleId: "article-1",
          article: { id: "article-1", status: "published", slug: "sample-slug" },
        },
      })
      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(400)
      expect(result.body.code).toBe("missing_canonical_url")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("short-circuits duplicates", async () => {
      const { store } = makeStore({
        post: {
          id: "threads-1",
          platform: "threads",
          content: `x\n${CANONICAL}`,
          status: "published",
          externalId: "already-1",
          articleId: "article-1",
          article: { id: "article-1", status: "published", slug: "sample-slug" },
        },
      })
      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(200)
      expect(result.body.alreadyPublished).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("publishes successfully with mocked Threads responses", async () => {
      const { store, updates, events } = makeStore({})
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "creation-1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "media-9" }),
        })

      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })

      expect(result.status).toBe(200)
      expect(result.body.ok).toBe(true)
      expect(result.body.externalId).toBe("media-9")
      expect(result.body.publicUrl).toBe(
        "https://www.threads.net/@echoesvisions/post/media-9",
      )
      expect(updates[0]).toMatchObject({
        status: "published",
        externalId: "media-9",
      })
      expect(events.some((e) => e.type === "social_publish")).toBe(true)

      const containerCall = String(fetchMock.mock.calls[0]?.[0] || "")
      const publishCall = String(fetchMock.mock.calls[1]?.[0] || "")
      expect(containerCall).toContain("/user-123/threads?")
      expect(containerCall).toContain(encodeURIComponent(CANONICAL))
      expect(publishCall).toContain("threads_publish")
      expect(publishCall).toContain("creation_id=creation-1")
      // Token is required by API query form; never assert/log the value beyond presence.
      expect(containerCall).toContain("access_token=")
      expect(JSON.stringify(result.body)).not.toContain("test-access-token")
    })

    it("reports provider container failures accurately", async () => {
      const { store, events } = makeStore({})
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "rate limited" } }),
      })
      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(502)
      expect(String(result.body.error)).toContain("container")
      expect(events[0]?.type).toBe("social_publish_failed")
    })

    it("reports provider publish-stage failures accurately", async () => {
      const { store, events } = makeStore({})
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "creation-1" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: { message: "publish denied" } }),
        })
      const result = await publishApprovedThreadsPost({
        postId: "threads-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(502)
      expect(String(result.body.error)).toContain("publish failed")
      expect(result.body.creationId).toBe("creation-1")
      expect(events.some((e) => e.type === "social_publish_failed")).toBe(true)
    })

    it("builds container/publish URLs for TEXT media", () => {
      expect(
        buildThreadsContainerUrl({
          userId: "1",
          text: "hello",
          accessToken: "t",
        }),
      ).toContain("media_type=TEXT")
      expect(
        buildThreadsPublishUrl({
          userId: "1",
          creationId: "c",
          accessToken: "t",
        }),
      ).toContain("creation_id=c")
    })
  })
})
