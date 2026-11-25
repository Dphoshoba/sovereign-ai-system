import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"
import {
  assertNoDirectorPrepareSideEffects,
  canRetryDirectorPrepare,
  describeDirectorPrepareOutcome,
  directorPrepareReviewPath,
  DIRECTOR_PREPARE_FORBIDDEN_SIDE_EFFECTS,
} from "../../lib/publishing/director-prepare-presentation"
import { LEGACY_AUTO_SCHEDULE_DISABLED_BODY } from "../../lib/publishing/legacy-auto-schedule"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const mockGetUser = vi.fn()
const runEditorialStages = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("../../lib/publishing/editorial-stage-runner", async () => {
  const actual = await vi.importActual<
    typeof import("../../lib/publishing/editorial-stage-runner")
  >("../../lib/publishing/editorial-stage-runner")
  return {
    ...actual,
    runEditorialStages: (...args: unknown[]) => runEditorialStages(...args),
  }
})

function editorUser() {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: "editor-1",
        email: "editor@example.com",
        app_metadata: { role: "editor" },
      },
    },
    error: null,
  })
}

describe("EV-EDITORIAL-07-P0U director prepare presentation", () => {
  it("describes outcomes and review navigation", () => {
    expect(describeDirectorPrepareOutcome("ready_for_human_review")).toMatch(
      /ready for Director review/i,
    )
    expect(describeDirectorPrepareOutcome("hold")).toMatch(/HOLD/i)
    expect(directorPrepareReviewPath("abc/123")).toBe(
      "/admin/articles/abc%2F123/edit",
    )
  })

  it("allows retry only for hold and prepare_failed", () => {
    expect(canRetryDirectorPrepare({ outcome: "hold" })).toBe(true)
    expect(
      canRetryDirectorPrepare({ outcome: "failed", code: "prepare_failed" }),
    ).toBe(true)
    expect(
      canRetryDirectorPrepare({
        outcome: "failed",
        code: "immutable_lifecycle",
      }),
    ).toBe(false)
    expect(
      canRetryDirectorPrepare({ outcome: "ready_for_human_review" }),
    ).toBe(false)
    expect(canRetryDirectorPrepare({ outcome: "already_applied" })).toBe(false)
  })

  it("forbids approval, schedule, publish, social, and image side effects", () => {
    expect(
      assertNoDirectorPrepareSideEffects(
        DIRECTOR_PREPARE_FORBIDDEN_SIDE_EFFECTS,
      ),
    ).toBe(true)
    expect(
      assertNoDirectorPrepareSideEffects({
        ...DIRECTOR_PREPARE_FORBIDDEN_SIDE_EFFECTS,
        featuredImageGenerated: true,
      }),
    ).toBe(false)
  })
})

describe("EV-EDITORIAL-07-P0U AI Generator → Stage Runner wiring", () => {
  it("AI Generator page uses directorPrepare and stage runner endpoints", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/ai-generator/page.tsx"),
      "utf8",
    )
    expect(source).toContain("Prepare for Director Review")
    expect(source).toContain('directorPrepare: true')
    expect(source).toContain("/api/articles/editorial-stage-runner")
    expect(source).toContain("/api/ai/generate-article")
    expect(source).not.toContain("Generate for Review")
  })

  it("generate-article directorPrepare path invokes stage runner and skips image", () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/ai/generate-article/route.ts"),
      "utf8",
    )
    expect(source).toContain("directorPrepare")
    expect(source).toContain("runEditorialStages")
    expect(source).toMatch(
      /if \(directorPrepare\)[\s\S]*runEditorialStages[\s\S]*generateAndPersistFeaturedImage/,
    )
    expect(source).toContain('status: directorPrepare ? "draft" : "review-required"')
  })

  it("PrepareForReviewButton targets the stage runner, not a parallel prepare path", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/articles/PrepareForReviewButton.tsx"),
      "utf8",
    )
    expect(source).toContain("/api/articles/editorial-stage-runner")
    expect(source).toContain("Prepare for Director Review")
    expect(source).not.toContain("/api/articles/prepare-for-review")
  })
})

describe("POST /api/articles/editorial-stage-runner auth + side effects", () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    runEditorialStages.mockReset()
  })

  it("rejects unauthenticated callers", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import(
      "../../app/api/articles/editorial-stage-runner/route"
    )
    const response = await POST(
      new NextRequest("http://localhost/api/articles/editorial-stage-runner", {
        method: "POST",
        body: JSON.stringify({ articleId: "a1" }),
      }),
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED_BODY)
    expect(runEditorialStages).not.toHaveBeenCalled()
  })

  it("rejects non-editor callers", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "reader@example.com",
          app_metadata: { role: "viewer" },
        },
      },
      error: null,
    })
    const { POST } = await import(
      "../../app/api/articles/editorial-stage-runner/route"
    )
    const response = await POST(
      new NextRequest("http://localhost/api/articles/editorial-stage-runner", {
        method: "POST",
        body: JSON.stringify({ articleId: "a1" }),
      }),
    )
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual(EDITOR_FORBIDDEN_BODY)
    expect(runEditorialStages).not.toHaveBeenCalled()
  })

  it("returns ready_for_human_review without forbidden side effects", async () => {
    editorUser()
    runEditorialStages.mockResolvedValue({
      ok: true,
      outcome: "ready_for_human_review",
      articleId: "a1",
      status: "review-required",
      stages: [],
      holdReason: null,
      audit: null,
      articleUnchanged: false,
      alreadyApplied: false,
      sideEffects: DIRECTOR_PREPARE_FORBIDDEN_SIDE_EFFECTS,
    })

    const { POST } = await import(
      "../../app/api/articles/editorial-stage-runner/route"
    )
    const response = await POST(
      new NextRequest("http://localhost/api/articles/editorial-stage-runner", {
        method: "POST",
        body: JSON.stringify({ articleId: "a1" }),
      }),
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.outcome).toBe("ready_for_human_review")
    expect(assertNoDirectorPrepareSideEffects(body.sideEffects)).toBe(true)
    expect(runEditorialStages).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: "editor@example.com",
        articleId: "a1",
      }),
      expect.anything(),
    )
  })

  it("returns HOLD with retry-safe presentation contract", async () => {
    editorUser()
    runEditorialStages.mockResolvedValue({
      ok: true,
      outcome: "hold",
      articleId: "a1",
      status: "draft",
      stages: [
        {
          id: "research_audit",
          status: "hold",
          detail: "HOLD: evidence incomplete",
        },
      ],
      holdReason: "HOLD: evidence incomplete",
      audit: null,
      articleUnchanged: true,
      alreadyApplied: false,
      sideEffects: DIRECTOR_PREPARE_FORBIDDEN_SIDE_EFFECTS,
    })

    const { POST } = await import(
      "../../app/api/articles/editorial-stage-runner/route"
    )
    const response = await POST(
      new NextRequest("http://localhost/api/articles/editorial-stage-runner", {
        method: "POST",
        body: JSON.stringify({ articleId: "a1" }),
      }),
    )
    const body = await response.json()
    expect(body.outcome).toBe("hold")
    expect(body.holdReason).toMatch(/HOLD/)
    expect(canRetryDirectorPrepare(body)).toBe(true)
  })
})

describe("legacy auto-schedule lockdown remains in force", () => {
  it("auto-schedule route still returns 410 disabled body", async () => {
    editorUser()
    const { POST } = await import("../../app/api/pipeline/auto-schedule/route")
    const response = await POST(
      new NextRequest("http://localhost/api/pipeline/auto-schedule", {
        method: "POST",
        body: JSON.stringify({ articleId: "a1" }),
      }),
    )
    expect(response.status).toBe(410)
    expect(await response.json()).toEqual(LEGACY_AUTO_SCHEDULE_DISABLED_BODY)
  })
})
