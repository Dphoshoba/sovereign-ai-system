import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const SPOOF = "spoofed-actor@example.com"

const mockGetUser = vi.fn()
const youtubeAnalyticsAgent = vi.fn()
const analyticsNormalizerAgent = vi.fn()
const reinforcementAgent = vi.fn()
const savePerformanceMemory = vi.fn()
const chatCreate = vi.fn()
const speechCreate = vi.fn()
const writeFile = vi.fn()
const existsSync = vi.fn(() => true)
const mkdirSync = vi.fn()
const writeFileSync = vi.fn()
const emailUpdate = vi.fn()
const emailCreate = vi.fn()
const operationalCreate = vi.fn()
const assetUpdate = vi.fn()
const workflowEventCreate = vi.fn()
const realtimeCreate = vi.fn()
const youtubeFindUnique = vi.fn()
const youtubeUpdate = vi.fn()
const youtubeCreate = vi.fn()
const articleFindUnique = vi.fn()
const subscriberUpsert = vi.fn()

const privilegedWork = [
  youtubeAnalyticsAgent,
  analyticsNormalizerAgent,
  reinforcementAgent,
  savePerformanceMemory,
  chatCreate,
  speechCreate,
  writeFile,
  existsSync,
  mkdirSync,
  writeFileSync,
  emailUpdate,
  emailCreate,
  operationalCreate,
  assetUpdate,
  workflowEventCreate,
  realtimeCreate,
  youtubeFindUnique,
  youtubeUpdate,
  youtubeCreate,
  articleFindUnique,
  subscriberUpsert,
]

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    chat: { completions: { create: (...args: unknown[]) => chatCreate(...args) } },
    audio: { speech: { create: (...args: unknown[]) => speechCreate(...args) } },
  }),
}))

vi.mock("fs", () => ({
  default: {
    existsSync: (...args: unknown[]) => existsSync(...args),
    mkdirSync: (...args: unknown[]) => mkdirSync(...args),
    writeFileSync: (...args: unknown[]) => writeFileSync(...args),
  },
  existsSync: (...args: unknown[]) => existsSync(...args),
  mkdirSync: (...args: unknown[]) => mkdirSync(...args),
  writeFileSync: (...args: unknown[]) => writeFileSync(...args),
}))

vi.mock("fs/promises", () => ({
  writeFile: (...args: unknown[]) => writeFile(...args),
}))

vi.mock("../../lib/agents/youtube-analytics-agent", () => ({
  youtubeAnalyticsAgent: (...args: unknown[]) => youtubeAnalyticsAgent(...args),
}))

vi.mock("../../lib/agents/analytics-normalizer-agent", () => ({
  analyticsNormalizerAgent: (...args: unknown[]) => analyticsNormalizerAgent(...args),
}))

vi.mock("../../lib/agents/reinforcement-agent", () => ({
  reinforcementAgent: (...args: unknown[]) => reinforcementAgent(...args),
}))

vi.mock("../../lib/agents/performance-memory-agent", () => ({
  savePerformanceMemory: (...args: unknown[]) => savePerformanceMemory(...args),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailExecution: {
      update: (...args: unknown[]) => emailUpdate(...args),
      create: (...args: unknown[]) => emailCreate(...args),
    },
    operationalEvent: { create: (...args: unknown[]) => operationalCreate(...args) },
    youTubePublishingAsset: { update: (...args: unknown[]) => assetUpdate(...args) },
    publishingWorkflowEvent: { create: (...args: unknown[]) => workflowEventCreate(...args) },
    realtimeEventMessage: { create: (...args: unknown[]) => realtimeCreate(...args) },
    youTubePost: {
      findUnique: (...args: unknown[]) => youtubeFindUnique(...args),
      update: (...args: unknown[]) => youtubeUpdate(...args),
      create: (...args: unknown[]) => youtubeCreate(...args),
    },
    article: { findUnique: (...args: unknown[]) => articleFindUnique(...args) },
    newsletterSubscriber: { upsert: (...args: unknown[]) => subscriberUpsert(...args) },
  },
}))

function session(user: unknown) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function user(role: "viewer" | "editor") {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    role: "authenticated",
    app_metadata: { role },
  }
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function chatJson(payload: unknown) {
  chatCreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  })
}

function expectNoPrivilegedWork() {
  for (const spy of privilegedWork) expect(spy).not.toHaveBeenCalled()
}

async function expectDenied(status: 401 | 403, run: () => Promise<Response>) {
  const response = await run()
  expect(response.status).toBe(status)
  expect(await response.json()).toEqual(
    status === 401 ? AUTHENTICATION_REQUIRED_BODY : EDITOR_FORBIDDEN_BODY
  )
  expectNoPrivilegedWork()
}

describe("B3 publishing and outbound authorisation", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    for (const spy of privilegedWork) spy.mockReset()
    existsSync.mockReturnValue(true)
  })

  it("rejects anonymous YouTube analytics before the provider call", async () => {
    session(null)
    const { POST } = await import("../../app/api/agents/youtube-analytics/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ accessToken: "token", videoId: "video-1", actorEmail: SPOOF }) as never)
    )
  })

  it("rejects a non-editor YouTube analytics request", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/agents/youtube-analytics/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ accessToken: "token", videoId: "video-1" }) as never)
    )
  })

  it("lets an editor collect YouTube analytics and save performance memory", async () => {
    session(user("editor"))
    youtubeAnalyticsAgent.mockResolvedValue({ rows: [] })
    analyticsNormalizerAgent.mockReturnValue({
      hasData: true,
      metrics: {
        views: 10,
        estimatedMinutesWatched: 4,
        averageViewDuration: 20,
        likes: 1,
        subscribersGained: 0,
      },
      reinforcementInput: null,
    })
    savePerformanceMemory.mockResolvedValue({ id: "memory-1" })

    const { POST } = await import("../../app/api/agents/youtube-analytics/route")
    const response = await POST(
      jsonRequest({ accessToken: "token", videoId: "video-1", title: "Lesson" }) as never
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.savedMemory.id).toBe("memory-1")
    expect(youtubeAnalyticsAgent).toHaveBeenCalledOnce()
    expect(savePerformanceMemory).toHaveBeenCalledOnce()
    expect(reinforcementAgent).not.toHaveBeenCalled()
  })

  it("rejects an anonymous email approval before it can be queued", async () => {
    session(null)
    const { POST } = await import("../../app/api/email-execution/approve/route")
    await expectDenied(401, () => POST(jsonRequest({ emailId: "email-1", actorEmail: SPOOF })))
  })

  it("rejects a non-editor email approval", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/email-execution/approve/route")
    await expectDenied(403, () => POST(jsonRequest({ emailId: "email-1" })))
  })

  it("lets an editor approve an email and record the approval", async () => {
    session(user("editor"))
    emailUpdate.mockResolvedValue({ id: "email-1", subject: "Hello", to: "reader@example.com" })
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/email-execution/approve/route")
    const response = await POST(jsonRequest({ emailId: "email-1", actorEmail: SPOOF }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.email.id).toBe("email-1")
    expect(emailUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "email-1" },
        data: { approved: true, status: "queued" },
      })
    )
    expect(operationalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "email-approved" }),
      })
    )
    expect(JSON.stringify(emailUpdate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous email draft before it can be queued", async () => {
    session(null)
    const { POST } = await import("../../app/api/email-execution/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ to: "reader@example.com", subject: "Hello", body: "Draft", approved: true }))
    )
  })

  it("rejects a non-editor email draft", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/email-execution/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ to: "reader@example.com", subject: "Hello", body: "Draft", approved: true }))
    )
  })

  it("keeps an editor draft in approval-required unless the editor approves it", async () => {
    session(user("editor"))
    emailCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "email-1",
      ...data,
    }))
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/email-execution/route")
    const response = await POST(
      jsonRequest({
        to: "reader@example.com",
        subject: "Hello",
        body: "Draft",
        approved: false,
        actorEmail: SPOOF,
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.email.status).toBe("approval-required")
    expect(body.email.approved).toBe(false)
    expect(JSON.stringify(emailCreate.mock.calls)).not.toContain(SPOOF)
  })

  it("rejects an anonymous publishing workflow change", async () => {
    session(null)
    const { POST } = await import("../../app/api/publishing-command/workflow/route")
    await expectDenied(401, () => POST(jsonRequest({ assetId: "asset-1", status: "scheduled" })))
  })

  it("rejects a non-editor publishing workflow change", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/publishing-command/workflow/route")
    await expectDenied(403, () => POST(jsonRequest({ assetId: "asset-1", status: "scheduled" })))
  })

  it("lets an editor move a publishing asset and record the workflow event", async () => {
    session(user("editor"))
    assetUpdate.mockResolvedValue({ id: "asset-1", title: "Lesson", status: "scheduled" })
    workflowEventCreate.mockResolvedValue({ id: "event-1", eventType: "status-change" })

    const { POST } = await import("../../app/api/publishing-command/workflow/route")
    const response = await POST(jsonRequest({ assetId: "asset-1", status: "scheduled" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.asset.status).toBe("scheduled")
    expect(body.event.eventType).toBe("status-change")
    expect(workflowEventCreate).toHaveBeenCalledOnce()
  })

  it("rejects an anonymous realtime publish", async () => {
    session(null)
    const { POST } = await import("../../app/api/realtime-fabric/publish/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ streamName: "live", eventType: "notice", title: "Update" }))
    )
  })

  it("rejects a non-editor realtime publish", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/realtime-fabric/publish/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ streamName: "live", eventType: "notice", title: "Update" }))
    )
  })

  it("lets an editor publish a realtime event", async () => {
    session(user("editor"))
    realtimeCreate.mockResolvedValue({
      id: "message-1",
      title: "Update",
      message: null,
      priority: "medium",
      streamName: "live",
      eventType: "notice",
    })
    operationalCreate.mockResolvedValue({ id: "event-1" })

    const { POST } = await import("../../app/api/realtime-fabric/publish/route")
    const response = await POST(
      jsonRequest({ streamName: "live", eventType: "notice", title: "Update" })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.message.id).toBe("message-1")
    expect(operationalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "realtime-event-published" }),
      })
    )
  })

  it("rejects anonymous emotion analysis", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/analyze-emotion/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects non-editor emotion analysis", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/analyze-emotion/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor analyse scene emotion", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({
      id: "post-1",
      sceneTimeline: [{ text: "discover this" }],
    })
    youtubeUpdate.mockImplementation(async ({ data }: { data: { sceneTimeline: unknown[] } }) => ({
      id: "post-1",
      sceneTimeline: data.sceneTimeline,
    }))

    const { POST } = await import("../../app/api/youtube/analyze-emotion/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.timeline[0].emotion).toBe("high")
    expect(youtubeUpdate).toHaveBeenCalledOnce()
  })

  it("rejects an anonymous scene timeline", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/build-scene-timeline/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects a non-editor scene timeline", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/build-scene-timeline/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor build a scene timeline", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({
      id: "post-1",
      fullScript: "Discover automation.",
      description: null,
      title: "Lesson",
    })
    youtubeUpdate.mockImplementation(async ({ data }: { data: { sceneTimeline: unknown[] } }) => ({
      id: "post-1",
      sceneTimeline: data.sceneTimeline,
    }))

    const { POST } = await import("../../app/api/youtube/build-scene-timeline/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.timeline.length).toBeGreaterThan(0)
    expect(youtubeUpdate).toHaveBeenCalledOnce()
  })

  it("rejects anonymous YouTube generation before the model call", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/generate/route")
    await expectDenied(401, () => POST(jsonRequest({ articleId: "article-1" })))
  })

  it("rejects non-editor YouTube generation", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/generate/route")
    await expectDenied(403, () => POST(jsonRequest({ articleId: "article-1" })))
  })

  it("lets an editor generate a YouTube post for review", async () => {
    session(user("editor"))
    articleFindUnique.mockResolvedValue({
      id: "article-1",
      title: "Lesson",
      excerpt: "Excerpt",
      content: "Content",
    })
    chatJson({
      title: "Video",
      description: "Description",
      tags: "faith",
      shortsCaption: "Watch",
      thumbnailPrompt: "Light",
      scriptOutline: "Outline",
    })
    youtubeCreate.mockResolvedValue({ id: "post-1", status: "review-required", title: "Video" })

    const { POST } = await import("../../app/api/youtube/generate/route")
    const response = await POST(jsonRequest({ articleId: "article-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.youtubePost.status).toBe("review-required")
    expect(chatCreate).toHaveBeenCalledOnce()
    expect(youtubeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "review-required", title: "Video" }),
      })
    )
  })

  it("rejects anonymous scene generation before the model call", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/generate-scenes/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects non-editor scene generation", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/generate-scenes/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor generate scenes", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({
      id: "post-1",
      title: "Lesson",
      description: "Description",
      fullScript: "Script",
    })
    chatJson({
      scenePlan: ["open"],
      brollSuggestions: ["desk"],
      cameraDirections: ["wide"],
      visualPrompts: ["light"],
      shortsScenes: ["hook"],
    })
    youtubeUpdate.mockResolvedValue({ id: "post-1", scenePlan: '["open"]' })

    const { POST } = await import("../../app/api/youtube/generate-scenes/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.post.id).toBe("post-1")
    expect(chatCreate).toHaveBeenCalledOnce()
    expect(youtubeUpdate).toHaveBeenCalledOnce()
  })

  it("rejects anonymous script generation before the model call", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/generate-script/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects non-editor script generation", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/generate-script/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor generate a script", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({ id: "post-1", title: "Lesson", description: "Description" })
    chatJson({
      fullScript: "Welcome.",
      shortsHooks: "Hook",
      retentionHooks: "Stay",
      chapterTimestamps: "0:00",
      cta: "Subscribe",
    })
    youtubeUpdate.mockResolvedValue({ id: "post-1", fullScript: "Welcome." })

    const { POST } = await import("../../app/api/youtube/generate-script/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.post.fullScript).toBe("Welcome.")
    expect(chatCreate).toHaveBeenCalledOnce()
  })

  it("rejects anonymous subtitles before writing a file", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/generate-subtitles/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects non-editor subtitles", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/generate-subtitles/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor generate subtitles", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({
      id: "post-1",
      fullScript: "Hello world.",
      description: null,
      title: "Lesson",
    })
    youtubeUpdate.mockResolvedValue({ id: "post-1", subtitleUrl: "/subtitles/post-1.srt" })

    const { POST } = await import("../../app/api/youtube/generate-subtitles/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.subtitleUrl).toBe("/subtitles/post-1.srt")
    expect(writeFileSync).toHaveBeenCalledOnce()
    expect(youtubeUpdate).toHaveBeenCalledOnce()
  })

  it("rejects anonymous title generation", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/generate-titles/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects non-editor title generation", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/generate-titles/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor rank titles and update the post", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({ id: "post-1", title: "Publishing", description: null })
    youtubeUpdate.mockResolvedValue({ id: "post-1" })

    const { POST } = await import("../../app/api/youtube/generate-titles/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.bestTitle.title).toContain("Publishing")
    expect(youtubeUpdate).toHaveBeenCalledOnce()
  })

  it("rejects anonymous voiceover generation before the provider call", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/generate-voiceover/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("rejects non-editor voiceover generation", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/generate-voiceover/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" })))
  })

  it("lets an editor generate a voiceover", async () => {
    session(user("editor"))
    youtubeFindUnique.mockResolvedValue({
      id: "post-1",
      title: "Lesson",
      fullScript: "Welcome.",
      scriptOutline: null,
      description: null,
    })
    speechCreate.mockResolvedValue({
      arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
    })
    youtubeUpdate.mockImplementation(async ({ data }: { data: { voiceoverUrl: string } }) => ({
      id: "post-1",
      voiceoverUrl: data.voiceoverUrl,
    }))

    const { POST } = await import("../../app/api/youtube/generate-voiceover/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.audioUrl).toMatch(/^\/voiceovers\//)
    expect(speechCreate).toHaveBeenCalledOnce()
    expect(writeFile).toHaveBeenCalledOnce()
  })

  it("rejects an anonymous schedule before the post is updated", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/schedule/route")
    await expectDenied(401, () =>
      POST(jsonRequest({ youtubePostId: "post-1", scheduledFor: "2026-12-01T08:00:00.000Z" }))
    )
  })

  it("rejects a non-editor schedule", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/schedule/route")
    await expectDenied(403, () =>
      POST(jsonRequest({ youtubePostId: "post-1", scheduledFor: "2026-12-01T08:00:00.000Z" }))
    )
  })

  it("lets an editor schedule a YouTube post", async () => {
    session(user("editor"))
    youtubeUpdate.mockResolvedValue({ id: "post-1", scheduledFor: "2026-12-01T08:00:00.000Z" })

    const { POST } = await import("../../app/api/youtube/schedule/route")
    const response = await POST(
      jsonRequest({ youtubePostId: "post-1", scheduledFor: "2026-12-01T08:00:00.000Z" })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.post.id).toBe("post-1")
    expect(youtubeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-1" },
        data: { scheduledFor: new Date("2026-12-01T08:00:00.000Z") },
      })
    )
  })

  it("rejects an anonymous upload schedule", async () => {
    session(null)
    const { POST } = await import("../../app/api/youtube/schedule-upload/route")
    await expectDenied(401, () => POST(jsonRequest({ youtubePostId: "post-1" }) as never))
  })

  it("rejects a non-editor upload schedule", async () => {
    session(user("viewer"))
    const { POST } = await import("../../app/api/youtube/schedule-upload/route")
    await expectDenied(403, () => POST(jsonRequest({ youtubePostId: "post-1" }) as never))
  })

  it("lets an editor schedule an upload", async () => {
    session(user("editor"))
    youtubeUpdate.mockImplementation(async ({ data }: { data: { uploadStatus: string } }) => ({
      id: "post-1",
      uploadStatus: data.uploadStatus,
      scheduledFor: new Date(),
    }))

    const { POST } = await import("../../app/api/youtube/schedule-upload/route")
    const response = await POST(jsonRequest({ youtubePostId: "post-1" }) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.post.uploadStatus).toBe("scheduled")
    expect(youtubeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ uploadStatus: "scheduled" }),
      })
    )
  })

  it("keeps the public blog newsletter signup available without an editor session", async () => {
    session(null)
    subscriberUpsert.mockResolvedValue({ id: "sub-1", email: "reader@example.com" })

    const { POST } = await import("../../app/api/newsletter/route")
    const response = await POST(jsonRequest({ name: "Reader", email: "reader@example.com" }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(subscriberUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "reader@example.com" },
      })
    )
  })
})
