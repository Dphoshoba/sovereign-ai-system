import fs from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  DEFAULT_FACEBOOK_GRAPH_VERSION,
  FACEBOOK_OAUTH_SCOPES,
  applyFacebookPageSelection,
  buildFacebookAuthorizeUrl,
  buildFacebookConnectionConfig,
  buildFacebookLongLivedUserTokenUrl,
  buildFacebookTokenExchangeUrl,
  inspectFacebookConnectionReadiness,
  parseFacebookPagesResponse,
  parseFacebookTokenResponse,
  readFacebookEnv,
  selectAuthorisedFacebookPage,
  summariseFacebookPages,
  validateFacebookOAuthState,
} from "../../lib/social/facebook-oauth"
import {
  buildFacebookFeedBody,
  buildFacebookFeedPublishUrl,
  extractFacebookPostId,
  publishApprovedFacebookPost,
  type FacebookPublishStore,
} from "../../lib/social/facebook-publish"
import { getPlatformCapabilities } from "../../lib/platform/execution/provider-contracts/social-provider"
import { canonicalArticleUrl } from "../../lib/social/x-publish-policy"

const cwd = process.cwd()
const CANONICAL = canonicalArticleUrl("sample-slug")

function makeStore(overrides: {
  post?: Record<string, unknown> | null
  integration?: Record<string, unknown> | null
}): {
  store: FacebookPublishStore
  updates: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
} {
  const updates: Array<Record<string, unknown>> = []
  const events: Array<Record<string, unknown>> = []
  const post =
    overrides.post === undefined
      ? {
          id: "fb-1",
          platform: "facebook",
          content: `A calm note.\n${CANONICAL}`,
          status: "approved",
          externalId: null,
          articleId: "article-1",
          article: {
            id: "article-1",
            status: "published",
            slug: "sample-slug",
            title: "Sample",
          },
        }
      : overrides.post

  const integration =
    overrides.integration === undefined
      ? {
          name: "Facebook",
          enabled: true,
          status: "connected",
          config: {
            pageAccessToken: "page-token",
            pageId: "page-123",
            pageName: "Echoes & Visions",
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
        }
      : overrides.integration

  const store: FacebookPublishStore = {
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

describe("EV-OPS-04 R3 — Facebook recovery readiness", () => {
  describe("recovered source paths", () => {
    it("restores OAuth, Page selection, and publish routes", () => {
      for (const rel of [
        "app/api/social/oauth/facebook/authorize/route.ts",
        "app/api/social/oauth/facebook/callback/route.ts",
        "app/api/social/oauth/facebook/status/route.ts",
        "app/api/social/oauth/facebook/select-page/route.ts",
        "app/api/social/publish/facebook/route.ts",
        "lib/social/facebook-oauth.ts",
        "lib/social/facebook-publish.ts",
      ]) {
        expect(fs.existsSync(path.join(cwd, rel))).toBe(true)
      }
    })

    it("marks Facebook publish-capable in provider contract", () => {
      const cap = getPlatformCapabilities("facebook")
      expect(cap.publishStatus).toBe("publish_capable")
      expect(cap.textPublishing).toBe(true)
    })

    it("does not add facebook to Production distribution-scope yet", () => {
      const src = fs.readFileSync(
        path.join(cwd, "lib/publishing/distribution-scope.ts"),
        "utf8",
      )
      expect(src).toMatch(/DistributionChannel = "x" \| "newsletter" \| "linkedin"/)
      expect(src).not.toMatch(/"facebook"/)
    })

    it("publish helper uses canonical /blog/{slug}, never /blog/ai-tools/", () => {
      const src = fs.readFileSync(
        path.join(cwd, "lib/social/facebook-publish.ts"),
        "utf8",
      )
      expect(src).toContain("canonicalArticleUrl")
      expect(src).not.toContain("/blog/ai-tools/")
      const route = fs.readFileSync(
        path.join(cwd, "app/api/social/publish/facebook/route.ts"),
        "utf8",
      )
      expect(route).not.toContain("/blog/ai-tools/")
    })
  })

  describe("OAuth helpers and credential protection", () => {
    it("builds authorize URL with Page scopes and state", () => {
      const url = buildFacebookAuthorizeUrl({
        appId: "app-id",
        redirectUri:
          "https://www.echoesandvisions.com/api/social/oauth/facebook/callback",
        state: "state-1",
      })
      expect(url).toContain("facebook.com/")
      expect(url).toContain("dialog/oauth")
      expect(url).toContain("client_id=app-id")
      expect(url).toContain("state=state-1")
      expect(url).toContain(encodeURIComponent(FACEBOOK_OAUTH_SCOPES.join(",")))
      expect(url).not.toMatch(/app_secret|client_secret/i)
    })

    it("validates OAuth state", () => {
      expect(
        validateFacebookOAuthState({ state: "a", cookieState: "a" }).ok,
      ).toBe(true)
      expect(
        validateFacebookOAuthState({ state: "a", cookieState: "b" }).ok,
      ).toBe(false)
    })

    it("builds token exchange and long-lived URLs", () => {
      const exchange = buildFacebookTokenExchangeUrl({
        appId: "id",
        appSecret: "secret",
        redirectUri: "https://example.com/cb",
        code: "CODE",
      })
      expect(exchange).toContain(`/oauth/access_token?`)
      expect(exchange).toContain("client_secret=secret")
      expect(exchange).toContain(DEFAULT_FACEBOOK_GRAPH_VERSION)

      const longLived = buildFacebookLongLivedUserTokenUrl({
        appId: "id",
        appSecret: "secret",
        shortLivedUserToken: "short",
      })
      expect(longLived).toContain("grant_type=fb_exchange_token")
    })

    it("parses token and pages responses", () => {
      expect(
        parseFacebookTokenResponse({
          access_token: "tok",
          expires_in: 3600,
        })?.accessToken,
      ).toBe("tok")

      const pages = parseFacebookPagesResponse({
        data: [
          {
            id: "p1",
            name: "Page One",
            category: "Publisher",
            tasks: ["CREATE_CONTENT", "ANALYZE"],
            access_token: "page-tok-1",
          },
          {
            id: "bad",
            name: "Missing token",
            tasks: ["CREATE_CONTENT"],
          },
        ],
      })
      expect(pages).toHaveLength(1)
      expect(pages[0]?.id).toBe("p1")
      expect(summariseFacebookPages(pages)[0]).not.toHaveProperty("accessToken")
    })

    it("detects missing env names only", () => {
      const missing = readFacebookEnv({} as NodeJS.ProcessEnv)
      expect(missing.ok).toBe(false)
      if (!missing.ok) {
        expect(missing.missing).toEqual([
          "FACEBOOK_APP_ID",
          "FACEBOOK_APP_SECRET",
          "FACEBOOK_REDIRECT_URI",
        ])
      }
    })
  })

  describe("explicit Page selection", () => {
    const pages = parseFacebookPagesResponse({
      data: [
        {
          id: "page-ok",
          name: "OK Page",
          tasks: ["CREATE_CONTENT"],
          access_token: "tok-ok",
        },
        {
          id: "page-analyze",
          name: "Analyze Only",
          tasks: ["ANALYZE"],
          access_token: "tok-analyze",
        },
      ],
    })

    it("selects authorised CREATE_CONTENT pages only", () => {
      const ok = selectAuthorisedFacebookPage({
        availablePages: pages,
        pageId: "page-ok",
      })
      expect(ok.ok).toBe(true)
    })

    it("rejects unauthorised Page identifiers", () => {
      const missing = selectAuthorisedFacebookPage({
        availablePages: pages,
        pageId: "page-unknown",
      })
      expect(missing.ok).toBe(false)
      if (!missing.ok) expect(missing.code).toBe("page_not_found")
    })

    it("rejects Pages lacking CREATE_CONTENT", () => {
      const denied = selectAuthorisedFacebookPage({
        availablePages: pages,
        pageId: "page-analyze",
      })
      expect(denied.ok).toBe(false)
      if (!denied.ok) expect(denied.code).toBe("page_lacks_create_content")
    })

    it("applies selection without auto-picking", () => {
      const config = buildFacebookConnectionConfig({
        userAccessToken: "user-tok",
        userId: "u1",
        availablePages: pages,
        expiresInSeconds: 3600,
      })
      expect(config.pageId).toBeNull()
      expect(config.providerStatus).toBe("connected_pending_page_selection")
      const selected = selectAuthorisedFacebookPage({
        availablePages: pages,
        pageId: "page-ok",
      })
      expect(selected.ok).toBe(true)
      if (!selected.ok) return
      const next = applyFacebookPageSelection(config, selected.page)
      expect(next.pageId).toBe("page-ok")
      expect(next.providerStatus).toBe("connected")

      const readiness = inspectFacebookConnectionReadiness({
        envConfigured: true,
        integrationEnabled: true,
        config: next,
      })
      expect(readiness.connected).toBe(true)
      expect(JSON.stringify(readiness)).not.toContain("tok-ok")
    })
  })

  describe("governed publication with mocked provider", () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fetchMock = vi.fn()
    })

    it("rejects unapproved posts", async () => {
      const { store } = makeStore({
        post: {
          id: "fb-1",
          platform: "facebook",
          content: `x\n${CANONICAL}`,
          status: "review-required",
          externalId: null,
          articleId: "article-1",
          article: {
            id: "article-1",
            status: "published",
            slug: "sample-slug",
          },
        },
      })
      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(403)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("rejects unpublished articles", async () => {
      const { store } = makeStore({
        post: {
          id: "fb-1",
          platform: "facebook",
          content: `x\n${CANONICAL}`,
          status: "approved",
          externalId: null,
          articleId: "article-1",
          article: {
            id: "article-1",
            status: "scheduled",
            slug: "sample-slug",
          },
        },
      })
      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(403)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("enforces canonical article URL and rejects /blog/ai-tools links", async () => {
      const { store } = makeStore({
        post: {
          id: "fb-1",
          platform: "facebook",
          content:
            "See https://www.echoesandvisions.com/blog/ai-tools/sample-slug",
          status: "approved",
          externalId: null,
          articleId: "article-1",
          article: {
            id: "article-1",
            status: "published",
            slug: "sample-slug",
          },
        },
      })
      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(422)
      expect(result.body.code).toBe("incorrect_article_link")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("short-circuits duplicates", async () => {
      const { store } = makeStore({
        post: {
          id: "fb-1",
          platform: "facebook",
          content: `x\n${CANONICAL}`,
          status: "published",
          externalId: "page-123_999",
          articleId: "article-1",
          article: {
            id: "article-1",
            status: "published",
            slug: "sample-slug",
          },
        },
      })
      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(200)
      expect(result.body.alreadyPublished).toBe(true)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("publishes successfully with mocked Graph feed response", async () => {
      const { store, updates, events } = makeStore({})
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "page-123_555" }),
      })

      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })

      expect(result.status).toBe(200)
      expect(result.body.externalId).toBe("page-123_555")
      expect(result.body.link).toBe(CANONICAL)
      expect(String(result.body.link)).not.toContain("/blog/ai-tools/")
      expect(updates[0]).toMatchObject({
        status: "published",
        externalId: "page-123_555",
      })
      expect(events.some((e) => e.type === "social_publish")).toBe(true)

      const calledUrl = String(fetchMock.mock.calls[0]?.[0] || "")
      expect(calledUrl).toContain("/page-123/feed")
      const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams
      expect(body.get("link")).toBe(CANONICAL)
      expect(JSON.stringify(result.body)).not.toContain("page-token")
    })

    it("reports provider errors accurately", async () => {
      const { store, events } = makeStore({})
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "(#200) Requires permission" } }),
      })
      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(502)
      expect(result.body.code).toBe("provider_error")
      expect(String(result.body.error)).toContain("Requires permission")
      expect(events[0]?.type).toBe("social_publish_failed")
    })

    it("handles ambiguous provider outcomes without marking published", async () => {
      const { store, updates, events } = makeStore({})
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      const result = await publishApprovedFacebookPost({
        postId: "fb-1",
        store,
        http: { fetch: fetchMock as unknown as typeof fetch },
      })
      expect(result.status).toBe(502)
      expect(result.body.code).toBe("ambiguous_provider_outcome")
      expect(updates).toHaveLength(0)
      expect(events[0]?.payload).toMatchObject({ ambiguous: true })
    })

    it("builds feed URL/body helpers", () => {
      expect(buildFacebookFeedPublishUrl({ pageId: "p1" })).toContain("/p1/feed")
      const body = buildFacebookFeedBody({
        message: "hi",
        pageAccessToken: "t",
        link: CANONICAL,
      })
      expect(body.get("message")).toBe("hi")
      expect(body.get("link")).toBe(CANONICAL)
      expect(extractFacebookPostId({ id: "x" })).toBe("x")
      expect(extractFacebookPostId({})).toBeNull()
    })
  })
})
