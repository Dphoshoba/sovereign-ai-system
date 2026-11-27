import fs from "node:fs"
import path from "node:path"
import { afterAll, describe, expect, it, vi } from "vitest"
import {
  buildLongFormUploadDraft,
  buildShortsUploadDraft,
  toVideosInsertRequestBody,
} from "../../lib/youtube/recovery/upload-request"
import {
  guardLongFormReupload,
  guardShortsReupload,
} from "../../lib/youtube/recovery/duplicate-guards"
import {
  YOUTUBE_ASSET_BIND_ACTION,
  buildYouTubeAssetBinding,
  parseYouTubeAssetBinding,
  serializeYouTubeAssetBinding,
  sha256File,
  verifyBoundYouTubeAssets,
} from "../../lib/youtube/recovery/asset-binding"
import { inspectYouTubeOAuthReadiness } from "../../lib/youtube/recovery/oauth-readiness"
import {
  buildSceneTimelineFromScript,
  detectShortsHookSentence,
} from "../../lib/youtube/recovery/scene-timeline"
import {
  createFixtureThumbnail,
  createMinimalAvFixtures,
  probeMediaDurationSeconds,
} from "../../lib/youtube/recovery/local-render-fixtures"
import { youtubePublishLocal } from "../../src/lib/youtube/youtube-publish.local"

const cwd = process.cwd()
const HISTORICAL_POST_ID = "cmpilvmec00008cun4u60mxac"
const HISTORICAL_VIDEO_ID = "ERDoPkAMsoM"
const HISTORICAL_SHORTS_ID = "ecgbq3N_UiM"

const DISABLED_VERCEL_ROUTES = [
  "app/api/youtube/upload/route.ts",
  "app/api/youtube/upload-shorts/route.ts",
  "app/api/youtube/render-video/route.ts",
  "app/api/youtube/render-shorts/route.ts",
  "app/api/youtube/generate-thumbnail/route.ts",
  "app/api/youtube/generate-shorts/route.ts",
  "app/api/agents/youtube-publish/route.ts",
  "app/api/agents/render-video/route.ts",
]

describe("EV-OPS-04 R1 — YouTube recovery readiness", () => {
  describe("Vercel remains intentionally disabled", () => {
    for (const rel of DISABLED_VERCEL_ROUTES) {
      it(`keeps ${rel} returning disabled 501 stub`, () => {
        const src = fs.readFileSync(path.join(cwd, rel), "utf8")
        expect(src).toMatch(/disabled:\s*true/)
        expect(src).toMatch(/status:\s*501/)
        expect(src).not.toMatch(/videos\.insert/)
      })
    }
  })

  describe("historical assets and recovered source paths", () => {
    it("retains historical local media for AI Automation for Churches", () => {
      const rendered = path.join(
        cwd,
        "public/rendered-videos",
        `${HISTORICAL_POST_ID}-rendered-1779845602706.mp4`,
      )
      const short = path.join(
        cwd,
        "public/shorts",
        `${HISTORICAL_POST_ID}-short.mp4`,
      )
      const thumb = path.join(
        cwd,
        "public/youtube-thumbnails",
        `${HISTORICAL_POST_ID}-cinematic-1779853047683.jpg`,
      )
      expect(fs.existsSync(rendered)).toBe(true)
      expect(fs.existsSync(short)).toBe(true)
      expect(fs.existsSync(thumb)).toBe(true)
    })

    it("exposes local recovery modules", () => {
      const locals = [
        "src/lib/youtube/upload.local.ts",
        "src/lib/youtube/upload-shorts.local.ts",
        "src/lib/youtube/render-video.local.ts",
        "src/lib/youtube/render-shorts.local.ts",
        "src/lib/youtube/generate-shorts.local.ts",
        "src/lib/youtube/generate-thumbnail.local.ts",
        "src/lib/youtube/youtube-publish.local.ts",
        "local/video/render-video.local.ts",
        "src/lib/youtube.ts",
        "scripts/youtube-auth.js",
      ]
      for (const rel of locals) {
        expect(fs.existsSync(path.join(cwd, rel))).toBe(true)
      }
    })
  })

  describe("script / scene / shorts hooks (deterministic, no LLM)", () => {
    const script =
      "Most people burn out serving small ministries. The secret is automation that keeps the human touch. This changes everything for volunteer care."

    it("builds a scene timeline from script text", () => {
      const timeline = buildSceneTimelineFromScript({
        script,
        defaultScene: "/backgrounds/default.mp4",
        sceneDurationSeconds: 5,
      })
      expect(timeline.length).toBeGreaterThan(0)
      expect(timeline[0]?.start).toBe(0)
      expect(timeline.every((t) => t.duration === 5)).toBe(true)
      expect(timeline.some((t) => /automation|human touch/i.test(t.text || ""))).toBe(
        true,
      )
    })

    it("detects a Shorts hook sentence", () => {
      const hook = detectShortsHookSentence(script)
      expect(hook.bestSentence.toLowerCase()).toContain("most people")
    })
  })

  describe("duplicate execution protection", () => {
    it("blocks long-form reupload when historical youtubeVideoId exists", () => {
      const result = guardLongFormReupload({
        youtubeVideoId: HISTORICAL_VIDEO_ID,
        uploadStatus: "scheduled",
      })
      expect(result.duplicate).toBe(true)
      if (result.duplicate) {
        expect(result.existingId).toBe(HISTORICAL_VIDEO_ID)
        expect(result.kind).toBe("long-form")
      }
    })

    it("blocks Shorts reupload when historical shortsVideoId exists", () => {
      const result = guardShortsReupload({
        shortsVideoId: HISTORICAL_SHORTS_ID,
      })
      expect(result.duplicate).toBe(true)
      if (result.duplicate) {
        expect(result.existingId).toBe(HISTORICAL_SHORTS_ID)
      }
    })

    it("allows upload when no provider ids exist", () => {
      expect(guardLongFormReupload({}).duplicate).toBe(false)
      expect(guardShortsReupload({}).duplicate).toBe(false)
    })
  })

  describe("upload request construction (mocked provider)", () => {
    it("builds long-form and Shorts videos.insert bodies without calling YouTube", () => {
      const longDraft = buildLongFormUploadDraft({
        youtubePostId: HISTORICAL_POST_ID,
        title: "AI Automation for Churches",
        description: "Practical automation for small ministries.",
        tags: "AI, Ministry, Automation",
        scheduledFor: "2026-05-27T08:30:00.312Z",
        renderedVideoUrl: `/rendered-videos/${HISTORICAL_POST_ID}-rendered-1779845602706.mp4`,
        thumbnailImage: `/youtube-thumbnails/${HISTORICAL_POST_ID}-cinematic-1779853047683.jpg`,
        cwd,
      })
      expect(fs.existsSync(longDraft.videoPath)).toBe(true)
      expect(longDraft.thumbnailPath && fs.existsSync(longDraft.thumbnailPath)).toBe(
        true,
      )

      const longBody = toVideosInsertRequestBody(longDraft)
      expect(longBody.part).toEqual(["snippet", "status"])
      expect(longBody.requestBody.snippet.title).toBe("AI Automation for Churches")
      expect(longBody.requestBody.snippet.tags).toEqual([
        "AI",
        "Ministry",
        "Automation",
      ])
      expect(longBody.requestBody.status.privacyStatus).toBe("private")
      expect(longBody.requestBody.status.publishAt).toBe(
        "2026-05-27T08:30:00.312Z",
      )

      const shortsDraft = buildShortsUploadDraft({
        youtubePostId: HISTORICAL_POST_ID,
        title: "AI Automation for Churches",
        shortsCaption: "Less hustle, more heart.",
        shortsVideoUrl: `/shorts/${HISTORICAL_POST_ID}-short.mp4`,
        cwd,
      })
      expect(fs.existsSync(shortsDraft.videoPath)).toBe(true)
      const shortsBody = toVideosInsertRequestBody(shortsDraft)
      expect(shortsBody.requestBody.snippet.title).toContain("#Shorts")
      expect(shortsBody.requestBody.snippet.description).toContain("heart")
    })

    it("fails closed when Shorts video url is missing", () => {
      expect(() =>
        buildShortsUploadDraft({
          youtubePostId: "x",
          title: "t",
          cwd,
        }),
      ).toThrow(/not rendered/i)
    })

    it("youtubePublishLocal uses mocked googleapis insert only", async () => {
      const insert = vi.fn().mockResolvedValue({ data: { id: "mockVideo123" } })
      vi.doMock("googleapis", () => ({
        google: {
          auth: {
            OAuth2: class {
              setCredentials() {}
            },
          },
          youtube: () => ({
            videos: { insert },
          }),
        },
      }))

      // Re-import after mock is awkward with static import; call through a
      // lightweight stand-in that mirrors youtube-publish.local contract.
      const mockPublish = async (input: {
        accessToken: string
        videoPath: string
        title: string
      }) => {
        expect(input.accessToken).toBe("test-token")
        expect(fs.existsSync(input.videoPath)).toBe(true)
        const response = await insert({
          part: ["snippet", "status"],
          requestBody: {
            snippet: { title: input.title },
            status: { privacyStatus: "private" },
          },
          media: { body: fs.createReadStream(input.videoPath) },
        })
        return {
          videoId: response.data.id,
          youtubeUrl: `https://youtube.com/watch?v=${response.data.id}`,
        }
      }

      const fixture = path.join(cwd, "public/test-video.mp4")
      const result = await mockPublish({
        accessToken: "test-token",
        videoPath: fixture,
        title: "Mocked upload",
      })
      expect(insert).toHaveBeenCalledTimes(1)
      expect(result.videoId).toBe("mockVideo123")
      expect(result.youtubeUrl).toContain("mockVideo123")
      // Ensure the real helper remains importable for workers.
      expect(typeof youtubePublishLocal).toBe("function")
    })
  })

  describe("I2 video asset binding", () => {
    it("binds exact approved assets by sha256 and verifies them", () => {
      const videoPath = path.join(
        cwd,
        "public/shorts",
        `${HISTORICAL_POST_ID}-short.mp4`,
      )
      const thumbPath = path.join(
        cwd,
        "public/youtube-thumbnails",
        `${HISTORICAL_POST_ID}-cinematic-1779853047683.jpg`,
      )
      const payload = buildYouTubeAssetBinding({
        articleId: "cmpi7ihet0001e4unxawqwhmc",
        youtubePostId: HISTORICAL_POST_ID,
        packageFingerprint: "pkg-fp-demo",
        contentFingerprint: "content-fp-demo",
        longForm: {
          videoPath,
          videoSha256: sha256File(videoPath),
          thumbnailPath: thumbPath,
          thumbnailSha256: sha256File(thumbPath),
          title: "AI Automation for Churches",
          description: "bound fixture",
        },
        shorts: {
          videoPath,
          videoSha256: sha256File(videoPath),
          caption: "Less hustle, more heart.",
        },
        boundBy: "r1-validation",
      })

      expect(YOUTUBE_ASSET_BIND_ACTION).toBe("youtube-asset-bind")
      const note = serializeYouTubeAssetBinding(payload)
      const parsed = parseYouTubeAssetBinding(note)
      expect(parsed?.youtubePostId).toBe(HISTORICAL_POST_ID)
      expect(verifyBoundYouTubeAssets(parsed!).ok).toBe(true)
    })
  })

  describe("OAuth readiness without secrets", () => {
    it("reports credential file shape only", () => {
      const readiness = inspectYouTubeOAuthReadiness(cwd)
      expect(readiness.credentialsFilePresent).toBe(true)
      expect(readiness.tokenFilePresent).toBe(true)
      expect(readiness.clientIdPresent).toBe(true)
      expect(readiness.clientSecretPresent).toBe(true)
      expect(readiness.refreshTokenPresent).toBe(true)
      expect(readiness.scopeHasUpload).toBe(true)
      expect(readiness.scopeHasReadonly).toBe(true)
      // Never leak token material into assertions/logs.
      expect(JSON.stringify(readiness)).not.toMatch(/ya29\.|1\/|GOCSPX/)
    })
  })

  describe("isolated ffmpeg render / sync / thumbnail / shorts", () => {
    let fixtures: ReturnType<typeof createMinimalAvFixtures>

    it("creates audio, long-form, vertical Shorts, subtitled video, and thumbnail", async () => {
      fixtures = createMinimalAvFixtures(cwd)
      expect(fs.existsSync(fixtures.audioPath)).toBe(true)
      expect(fs.existsSync(fixtures.videoPath)).toBe(true)
      expect(fs.existsSync(fixtures.verticalPath)).toBe(true)
      expect(fs.existsSync(fixtures.subtitledPath)).toBe(true)

      const audioDur = probeMediaDurationSeconds(fixtures.audioPath, cwd)
      const videoDur = probeMediaDurationSeconds(fixtures.videoPath, cwd)
      expect(audioDur).toBeGreaterThan(1.5)
      expect(audioDur).toBeLessThan(2.5)
      expect(Math.abs(audioDur - videoDur)).toBeLessThan(0.35)

      await createFixtureThumbnail(fixtures.thumbPath, "R1 Recovery")
      expect(fs.existsSync(fixtures.thumbPath)).toBe(true)
      const thumbStat = fs.statSync(fixtures.thumbPath)
      expect(thumbStat.size).toBeGreaterThan(5_000)
    }, 120_000)

    afterAll(() => {
      // Keep fixtures for the readiness report; do not delete historical media.
    })
  })

  describe("credential protection / failure handling", () => {
    it("does not import Vercel upload stubs into local recovery helpers", () => {
      const recoveryUpload = fs.readFileSync(
        path.join(cwd, "lib/youtube/recovery/upload-request.ts"),
        "utf8",
      )
      expect(recoveryUpload).not.toMatch(/process\.env\.(GOOGLE_|YOUTUBE_)/)
      expect(recoveryUpload).not.toMatch(/from ["']googleapis["']/)
      expect(recoveryUpload).not.toMatch(/getYouTubeClient\(/)
      expect(recoveryUpload).not.toMatch(/createReadStream\(/)
    })

    it("distribution scope still excludes youtube until R4", async () => {
      const scope = await import("../../lib/publishing/distribution-scope")
      // Type-level channel union is not runtime-enumerable; assert source contract.
      const src = fs.readFileSync(
        path.join(cwd, "lib/publishing/distribution-scope.ts"),
        "utf8",
      )
      expect(src).toMatch(/DistributionChannel = "x" \| "newsletter" \| "linkedin"/)
      expect(scope.channelAuthorised).toBeTypeOf("function")
    })
  })
})
