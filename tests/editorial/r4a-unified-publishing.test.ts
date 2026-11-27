import { describe, expect, it, beforeAll } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  computePackageFingerprint,
  channelAuthorised,
  resolveAuthorisedChannels,
  serializeDistributionScope,
  DISTRIBUTION_CHANNELS,
  ORDINARY_WORK_ARTICLE_ID,
  LIVING_BEYOND_ARTICLE_ID,
  type DistributionChannel,
} from "../../lib/publishing/distribution-scope"
import { buildPublicationPackage } from "../../lib/publishing/publication-package"
import {
  buildChannelClaimId,
  classifyProviderTimeoutAsAmbiguous,
  shouldBlockRetry,
} from "../../lib/publishing/channel-execution-guard"
import { buildMultimediaPackageReadiness } from "../../lib/publishing/multimedia-package-readiness"
import { publishAuthorisedThreadsAfterScheduledPublish } from "../../lib/social/after-scheduled-publish-threads"
import { publishAuthorisedFacebookAfterScheduledPublish } from "../../lib/social/after-scheduled-publish-facebook"
import {
  claimNextYoutubeWorkerJob,
  executeAuthorisedYoutubeUpload,
  prepareRepresentativeFixturePackage,
  reportYoutubeWorkerHealth,
} from "../../lib/youtube/worker/media-worker"
import { DEFAULT_FACEBOOK_GRAPH_VERSION } from "../../lib/social/facebook-oauth"
import { THREADS_GRAPH_BASE } from "../../lib/social/threads-oauth"

const cwd = process.cwd()

const LEGACY_FP_PARTS = {
  articleId: "art-legacy-1",
  contentFingerprint: "content-fp-1",
  featuredImage: "https://cdn.example/img.jpg",
  seoTitle: "SEO Title",
  seoDescription: "SEO Desc",
  seoKeywords: "a,b",
  xContent: "X copy https://www.echoesandvisions.com/blog/slug",
  linkedinContent: "LI copy",
  newsletterSubject: "NL subject",
  newsletterPreview: "preview",
  newsletterBody: "body",
  channels: ["x", "newsletter", "linkedin"] as DistributionChannel[],
  scheduledFor: "2026-12-09T20:30:00.000Z",
}

describe("EV-OPS-04 R4-A unified publishing", () => {
  describe("distribution scope expansion + backward compatibility", () => {
    it("exposes additive channels including independent youtube and youtube-shorts", () => {
      expect(DISTRIBUTION_CHANNELS).toEqual([
        "x",
        "newsletter",
        "linkedin",
        "threads",
        "facebook",
        "youtube",
        "youtube-shorts",
      ])
    })

    it("preserves legacy fingerprint bytes when only legacy channels are used", () => {
      const legacy = computePackageFingerprint(LEGACY_FP_PARTS)
      const withUnusedExtended = computePackageFingerprint({
        ...LEGACY_FP_PARTS,
        threadsContent: "should-not-affect",
        facebookContent: "should-not-affect",
        youtubeAssetFingerprint: "should-not-affect",
      })
      expect(withUnusedExtended).toBe(legacy)
    })

    it("changes fingerprint when new channels are selected", () => {
      const legacy = computePackageFingerprint(LEGACY_FP_PARTS)
      const withThreads = computePackageFingerprint({
        ...LEGACY_FP_PARTS,
        channels: ["x", "threads"],
        threadsContent: "Threads copy",
      })
      expect(withThreads).not.toBe(legacy)
    })

    it("keeps Ordinary Work hard-mapped to X only", () => {
      const auth = resolveAuthorisedChannels({
        articleId: ORDINARY_WORK_ARTICLE_ID,
        reviewNotes: [
          {
            action: "distribution-scope",
            note: serializeDistributionScope({
              v: 1,
              channels: ["x", "threads", "facebook", "youtube"],
              packageFingerprint: "attacker",
              articleId: ORDINARY_WORK_ARTICLE_ID,
              boundAt: new Date().toISOString(),
              boundBy: "attacker",
            }),
          },
        ],
      })
      expect(auth.channels).toEqual(["x"])
      expect(channelAuthorised(auth.scope, "threads")).toBe(false)
      expect(channelAuthorised(auth.scope, "facebook")).toBe(false)
      expect(channelAuthorised(auth.scope, "youtube")).toBe(false)
    })

    it("does not auto-authorise new channels without a bound scope", () => {
      const auth = resolveAuthorisedChannels({
        articleId: "some-other-article",
        reviewNotes: [],
      })
      expect(auth.channels).toEqual([])
      expect(auth.source).toBe("none")
    })

    it("protects Living Beyond id constant for activation gates", () => {
      expect(LIVING_BEYOND_ARTICLE_ID).toBe("cmwytw0h8000007l3t7v45c5k")
    })
  })

  describe("multimedia package completeness", () => {
    it("requires reviewable youtube assets before I2 when youtube channels selected", () => {
      const base = {
        article: {
          id: "a1",
          title: "T",
          slug: "s",
          status: "scheduled",
          excerpt: "e",
          content: "full article",
          featuredImage: "https://cdn.example/i.jpg",
          seoTitle: "seo",
          seoDescription: "desc",
          seoKeywords: "k",
          scheduledFor: "2026-12-20T20:30:00.000Z",
          reviewNotes: [],
        },
        contentFingerprint: "cfp",
        evidenceSummary: {
          auditId: "audit-1",
          recommendation: "publish",
          consensusScore: 0.9,
          sourceQualityScore: 0.8,
        },
        xAnnouncement: { id: "x1", content: "x", status: "approved" },
        linkedinAnnouncement: null,
        newsletter: null,
        youtubeAssets: {
          youtubePostId: "yt1",
          title: "Video",
          description: "Desc",
          longFormReady: false,
          shortsReady: false,
        },
        requestedChannels: ["x", "youtube", "youtube-shorts"] as DistributionChannel[],
      }
      const incomplete = buildPublicationPackage(base)
      expect(incomplete.complete).toBe(false)
      expect(incomplete.missing).toEqual(
        expect.arrayContaining(["youtube", "youtube-shorts"]),
      )

      const complete = buildPublicationPackage({
        ...base,
        youtubeAssets: {
          youtubePostId: "yt1",
          title: "Video",
          description: "Desc",
          longFormVideoSha256: "lfsha",
          shortsVideoSha256: "ssha",
          longFormReady: true,
          shortsReady: true,
        },
      })
      expect(complete.complete).toBe(true)
      expect(complete.missing).toEqual([])
    })

    it("builds coherent Director package readiness rows", () => {
      const readiness = buildMultimediaPackageReadiness({
        article: {
          id: "a1",
          title: "T",
          slug: "s",
          status: "scheduled",
          excerpt: "e",
          content: "full",
          featuredImage: "https://cdn.example/i.jpg",
          seoTitle: "seo",
          seoDescription: "desc",
          seoKeywords: "k",
          scheduledFor: "2026-12-20T20:30:00.000Z",
          reviewNotes: [
            {
              action: "distribution-scope",
              note: serializeDistributionScope({
                v: 1,
                channels: ["x", "threads"],
                packageFingerprint: "pfp",
                articleId: "a1",
                boundAt: new Date().toISOString(),
                boundBy: "director",
              }),
            },
          ],
        },
        contentFingerprint: "cfp",
        evidenceSummary: {
          auditId: "audit",
          recommendation: "publish",
          consensusScore: 1,
          sourceQualityScore: 1,
        },
        xAnnouncement: { id: "x", content: "x copy", status: "approved" },
        linkedinAnnouncement: null,
        threadsAnnouncement: { id: "th", content: "th copy", status: "approved" },
        newsletter: null,
        connectionStatus: { threads: "@echoes" },
      })
      expect(readiness.rows.some((r) => r.channel === "website")).toBe(true)
      expect(readiness.rows.find((r) => r.channel === "threads")?.assetReady).toBe(
        true,
      )
      expect(readiness.socialCopy.threads).toBe("th copy")
    })
  })

  describe("concurrency and ambiguous outcomes", () => {
    it("blocks concurrent claim and already-published retries", () => {
      const claimId = buildChannelClaimId({
        channel: "threads",
        articleId: "a1",
        payloadId: "p1",
      })
      expect(claimId).toBe("threads:a1:p1")

      expect(
        shouldBlockRetry({
          existingExternalId: "ext-1",
        }).block,
      ).toBe(true)

      expect(
        shouldBlockRetry({
          openClaim: {
            v: 1,
            channel: "threads",
            articleId: "a1",
            payloadId: "p1",
            claimId,
            claimedAt: new Date().toISOString(),
            actor: "w1",
          },
        }).code,
      ).toBe("claim_in_progress")

      expect(
        shouldBlockRetry({
          priorOutcome: {
            v: 1,
            channel: "threads",
            articleId: "a1",
            payloadId: "p1",
            claimId,
            status: "ambiguous",
            recordedAt: new Date().toISOString(),
          },
        }).code,
      ).toBe("ambiguous_unresolved")
    })

    it("classifies timeout after submission without provider id as ambiguous", () => {
      expect(
        classifyProviderTimeoutAsAmbiguous({
          submittedToProvider: true,
          providerId: null,
          timedOut: true,
        }),
      ).toBe("ambiguous")
      expect(
        classifyProviderTimeoutAsAmbiguous({
          submittedToProvider: true,
          providerId: "vid-1",
          timedOut: false,
        }),
      ).toBe("provider_accepted")
    })
  })

  describe("mocked Threads and Facebook after-publish", () => {
    const scopeNote = serializeDistributionScope({
      v: 1,
      channels: ["x", "threads", "facebook"],
      packageFingerprint: "pfp",
      articleId: "art-r4a",
      boundAt: new Date().toISOString(),
      boundBy: "director",
    })

    it("skips Threads when channel not authorised", async () => {
      const result = await publishAuthorisedThreadsAfterScheduledPublish({
        article: {
          id: "art-r4a",
          slug: "slug",
          status: "published",
          featuredImage: "https://cdn.example/i.jpg",
          reviewNotes: [],
        },
        socialPosts: [],
        store: {} as never,
        fetchImpl: async () => new Response("ok", { status: 200 }),
      })
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.skipped).toBe(true)
    })

    it("publishes mocked Threads when authorised and approved", async () => {
      const events: unknown[] = []
      const store = {
        socialPost: {
          findUnique: async () => ({
            id: "th1",
            platform: "threads",
            content:
              "Hello https://www.echoesandvisions.com/blog/slug",
            status: "approved",
            externalId: null,
            articleId: "art-r4a",
            article: { id: "art-r4a", status: "published", slug: "slug" },
          }),
          update: async ({ data }: { data: Record<string, unknown> }) => ({
            id: "th1",
            platform: "threads",
            content: "Hello",
            status: String(data.status),
            externalId: data.externalId as string,
            articleId: "art-r4a",
            article: { id: "art-r4a", status: "published", slug: "slug" },
          }),
        },
        externalIntegration: {
          findUnique: async () => ({
            name: "Threads",
            enabled: true,
            status: "connected",
            config: {
              accessToken: "token",
              userId: "uid",
              username: "echoes",
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            },
          }),
        },
        operationalEvent: {
          create: async ({ data }: { data: unknown }) => {
            events.push(data)
            return data
          },
        },
      }

      const fetchImpl = async (url: string | URL) => {
        const u = String(url)
        // Provider hosts first — post body also contains the canonical article URL.
        if (u.includes("graph.threads.net")) {
          if (u.includes("threads_publish")) {
            return Response.json({ id: "media-999" })
          }
          if (u.includes("/threads?")) {
            return Response.json({ id: "container-1" })
          }
          return Response.json({ id: "uid", username: "echoes" })
        }
        if (u.startsWith("https://cdn.example") || u.startsWith("https://www.echoesandvisions.com")) {
          return new Response("<html>ok</html>", { status: 200 })
        }
        return Response.json({ ok: true })
      }

      const result = await publishAuthorisedThreadsAfterScheduledPublish({
        article: {
          id: "art-r4a",
          slug: "slug",
          status: "published",
          featuredImage: "https://cdn.example/i.jpg",
          reviewNotes: [{ action: "distribution-scope", note: scopeNote }],
        },
        socialPosts: [
          {
            id: "th1",
            platform: "threads",
            content: "Hello https://www.echoesandvisions.com/blog/slug",
            status: "approved",
            externalId: null,
          },
        ],
        store: store as never,
        fetchImpl: fetchImpl as typeof fetch,
      })
      if (!result.ok) {
        // Surface reason for diagnosis in CI logs.
        expect({ ok: result.ok, code: result.code, reason: result.reason }).toEqual(
          expect.objectContaining({ ok: true }),
        )
      }
      expect(result.ok).toBe(true)
      if (result.ok && !result.skipped) {
        expect(result.externalId).toBeTruthy()
      }
      expect(events.length).toBeGreaterThan(0)
    })

    it("blocks Facebook without explicit Page selection", async () => {
      const store = {
        socialPost: {
          findUnique: async () => ({
            id: "fb1",
            platform: "facebook",
            content:
              "Hello https://www.echoesandvisions.com/blog/slug",
            status: "approved",
            externalId: null,
            articleId: "art-r4a",
            article: {
              id: "art-r4a",
              status: "published",
              slug: "slug",
              title: "T",
            },
          }),
          update: async () => {
            throw new Error("should not update")
          },
        },
        externalIntegration: {
          findUnique: async () => ({
            name: "Facebook",
            enabled: true,
            status: "connected",
            config: {
              userAccessToken: "user",
              userId: "u1",
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
              // pageId intentionally missing
            },
          }),
        },
        operationalEvent: {
          create: async () => ({}),
        },
      }

      const result = await publishAuthorisedFacebookAfterScheduledPublish({
        article: {
          id: "art-r4a",
          slug: "slug",
          status: "published",
          featuredImage: "https://cdn.example/i.jpg",
          reviewNotes: [{ action: "distribution-scope", note: scopeNote }],
        },
        socialPosts: [
          {
            id: "fb1",
            platform: "facebook",
            content: "Hello https://www.echoesandvisions.com/blog/slug",
            status: "approved",
            externalId: null,
          },
        ],
        store: store as never,
        fetchImpl: async () => new Response("ok", { status: 200 }),
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("page_not_selected")
    })

    it("publishes mocked Facebook when Page selected", async () => {
      const store = {
        socialPost: {
          findUnique: async () => ({
            id: "fb1",
            platform: "facebook",
            content:
              "Hello https://www.echoesandvisions.com/blog/slug",
            status: "approved",
            externalId: null,
            articleId: "art-r4a",
            article: {
              id: "art-r4a",
              status: "published",
              slug: "slug",
              title: "T",
            },
          }),
          update: async ({ data }: { data: Record<string, unknown> }) => ({
            id: "fb1",
            platform: "facebook",
            content: "Hello",
            status: String(data.status),
            externalId: data.externalId as string,
            articleId: "art-r4a",
            article: {
              id: "art-r4a",
              status: "published",
              slug: "slug",
              title: "T",
            },
          }),
        },
        externalIntegration: {
          findUnique: async () => ({
            name: "Facebook",
            enabled: true,
            status: "connected",
            config: {
              userAccessToken: "user",
              userId: "u1",
              pageId: "page-1",
              pageName: "Echoes Page",
              pageAccessToken: "page-token",
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            },
          }),
        },
        operationalEvent: {
          create: async () => ({}),
        },
      }

      const result = await publishAuthorisedFacebookAfterScheduledPublish({
        article: {
          id: "art-r4a",
          slug: "slug",
          status: "published",
          featuredImage: "https://cdn.example/i.jpg",
          reviewNotes: [{ action: "distribution-scope", note: scopeNote }],
        },
        socialPosts: [
          {
            id: "fb1",
            platform: "facebook",
            content: "Hello https://www.echoesandvisions.com/blog/slug",
            status: "approved",
            externalId: null,
          },
        ],
        store: store as never,
        fetchImpl: async (url: string | URL) => {
          const u = String(url)
          if (u.includes("cdn.example") || u.includes("echoesandvisions.com")) {
            return new Response("ok", { status: 200 })
          }
          return Response.json({ id: "page-1_999" })
        },
      })
      expect(result.ok).toBe(true)
      if (result.ok && !result.skipped) {
        expect(result.externalId).toBe("page-1_999")
      }
    })
  })

  describe("YouTube worker + Shorts pipeline", () => {
    it("reports health for local non-Vercel runtime", () => {
      const health = reportYoutubeWorkerHealth(cwd)
      expect(health.vercelHeavyRoutesDisabled).toBe(true)
      expect(health.runtime.isVercel).toBe(false)
      expect(health.capabilities).toContain("job-claiming")
      expect(health.mediaStorage.writable).toBe(true)
    })

    it("prepares representative fixture package with binding verification", async () => {
      const demo = await prepareRepresentativeFixturePackage({
        articleId: "r4a-test-article",
        youtubePostId: "yt-r4a-test",
        cwd,
      })
      expect(demo.ok).toBe(true)
      expect(fs.existsSync(demo.assets.longFormPath)).toBe(true)
      expect(fs.existsSync(demo.assets.shortsPath)).toBe(true)
      expect(demo.assets.longFormSha256).toHaveLength(64)
      expect(demo.note).toMatch(/not cinematic/i)
    }, 120_000)

    it("claims jobs with duplicate protection and dry-run upload", async () => {
      const jobs = [
        {
          id: "job-1",
          type: "youtube-prepare",
          status: "queued",
          payload: { articleId: "a" },
          scheduledAt: new Date(0),
        },
      ]
      const events: unknown[] = []
      const store = {
        aiJob: {
          findFirst: async () => jobs.find((j) => j.status === "queued") ?? null,
          updateMany: async ({
            where,
            data,
          }: {
            where: Record<string, unknown>
            data: Record<string, unknown>
          }) => {
            const job = jobs.find((j) => j.id === where.id)
            if (!job || job.status !== "queued") return { count: 0 }
            Object.assign(job, data)
            return { count: 1 }
          },
          update: async ({
            where,
            data,
          }: {
            where: { id: string }
            data: Record<string, unknown>
          }) => {
            const job = jobs.find((j) => j.id === where.id)!
            Object.assign(job, data)
            return job
          },
        },
        operationalEvent: {
          create: async ({ data }: { data: unknown }) => {
            events.push(data)
            return data
          },
        },
      }

      const first = await claimNextYoutubeWorkerJob({
        store: store as never,
        workerId: "w1",
      })
      const second = await claimNextYoutubeWorkerJob({
        store: store as never,
        workerId: "w2",
      })
      expect(first?.id).toBe("job-1")
      expect(second).toBeNull()

      const demo = await prepareRepresentativeFixturePackage({
        youtubePostId: "yt-upload-test",
        cwd,
      })
      const upload = await executeAuthorisedYoutubeUpload({
        kind: "long-form",
        articleId: demo.articleId,
        youtubePostId: demo.youtubePostId,
        binding: demo.binding,
        post: {},
        store: store as never,
        workerId: "w1",
        dryRun: true,
      })
      expect(upload.ok).toBe(true)

      const restart = await executeAuthorisedYoutubeUpload({
        kind: "long-form",
        articleId: demo.articleId,
        youtubePostId: demo.youtubePostId,
        binding: demo.binding,
        post: { youtubeVideoId: "already-uploaded" },
        store: store as never,
        workerId: "w1",
        dryRun: true,
      })
      expect(restart.ok).toBe(true)
      if (restart.ok) expect(restart.skipped).toBe(true)

      const ambiguous = await executeAuthorisedYoutubeUpload({
        kind: "shorts",
        articleId: demo.articleId,
        youtubePostId: demo.youtubePostId,
        binding: demo.binding,
        post: {},
        store: store as never,
        workerId: "w1",
        uploadFn: async () => ({ videoId: null, timedOut: true }),
      })
      expect(ambiguous.ok).toBe(false)
      if (!ambiguous.ok) expect(ambiguous.code).toBe("ambiguous_unresolved")
    }, 120_000)

    it("replaces Shorts placeholder with vertical ffmpeg pipeline", () => {
      const src = fs.readFileSync(
        path.join(cwd, "src/lib/youtube/render-shorts.local.ts"),
        "utf8",
      )
      expect(src).toContain("1080:1920")
      expect(src).toContain("fluent-ffmpeg")
      expect(src).not.toMatch(/TEMP:[\s\S]*Reuse placeholder video/)
      expect(src).not.toContain('copyFileSync(\n      sourceVideo')
    })

    it("keeps Vercel heavy YouTube routes disabled", () => {
      for (const rel of [
        "app/api/youtube/render-video/route.ts",
        "app/api/youtube/render-shorts/route.ts",
        "app/api/youtube/upload/route.ts",
        "app/api/youtube/generate-shorts/route.ts",
      ]) {
        const src = fs.readFileSync(path.join(cwd, rel), "utf8")
        expect(src.toLowerCase()).toMatch(/disabled on vercel|serverless/)
      }
    })
  })

  describe("provider API readiness + security surfaces", () => {
    it("uses supported Facebook Graph default (not retiring v21)", () => {
      expect(DEFAULT_FACEBOOK_GRAPH_VERSION).toBe("v27.0")
    })

    it("keeps Threads on graph.threads.net/v1.0", () => {
      expect(THREADS_GRAPH_BASE).toBe("https://graph.threads.net/v1.0")
    })

    it("wires after-publish Threads/Facebook into publish-due-articles", () => {
      const src = fs.readFileSync(
        path.join(cwd, "lib/publishing/publish-due-articles.ts"),
        "utf8",
      )
      expect(src).toContain("publishAuthorisedThreadsAfterScheduledPublish")
      expect(src).toContain("publishAuthorisedFacebookAfterScheduledPublish")
      expect(src).toContain("threadsOutcomes")
      expect(src).toContain("facebookOutcomes")
    })

    it("protects OW and Living Beyond in distribution-scope route", () => {
      const src = fs.readFileSync(
        path.join(cwd, "app/api/articles/distribution-scope/route.ts"),
        "utf8",
      )
      expect(src).toContain("ordinary_work_protected")
      expect(src).toContain("living_beyond_protected")
      expect(src).toContain("threads")
      expect(src).toContain("facebook")
      expect(src).toContain("DISTRIBUTION_CHANNELS")
      expect(src).toContain("youtubeAssets")
    })

    it("does not commit secrets in worker or oauth helpers", () => {
      const worker = fs.readFileSync(
        path.join(cwd, "lib/youtube/worker/media-worker.ts"),
        "utf8",
      )
      expect(worker).not.toMatch(/sk-[a-zA-Z0-9]{10,}/)
      expect(worker).not.toMatch(/ya29\.[a-zA-Z0-9_-]+/)
    })
  })
})
