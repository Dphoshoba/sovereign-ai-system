import { beforeEach, describe, expect, it, vi } from "vitest"
import { canPublishAsEditor } from "../../lib/publishing/editor-access"
import {
  AUTHENTICATION_REQUIRED_BODY,
  EDITOR_FORBIDDEN_BODY,
} from "../../lib/publishing/require-editor-auth"

const mockGetUser = vi.fn()
const articleCreate = vi.fn()
const updateArticle = vi.fn()
const prepare = vi.fn()
const transition = vi.fn()
const queueUpdate = vi.fn()
const newsletterUpdate = vi.fn()
const newsletterFindUnique = vi.fn()
const newsletterDelete = vi.fn()
const generateNewsletter = vi.fn()
const articleFindUnique = vi.fn()
const draftCreate = vi.fn()
const chatCreate = vi.fn()
const publish = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      create: (...args: unknown[]) => articleCreate(...args),
      findUnique: (...args: unknown[]) => articleFindUnique(...args),
    },
    publishingQueue: {
      update: (...args: unknown[]) => queueUpdate(...args),
    },
    newsletter: {
      update: (...args: unknown[]) => newsletterUpdate(...args),
      findUnique: (...args: unknown[]) => newsletterFindUnique(...args),
      delete: (...args: unknown[]) => newsletterDelete(...args),
    },
    newsletterDraft: {
      create: (...args: unknown[]) => draftCreate(...args),
    },
  },
}))

vi.mock("../../lib/publishing/article-lifecycle", () => ({
  updateArticleUnderGovernanceLock: (...args: unknown[]) => updateArticle(...args),
  transitionArticleLifecycle: (...args: unknown[]) => transition(...args),
}))

vi.mock("../../lib/research/prepare-article-for-review", () => ({
  prepareArticleForReview: (...args: unknown[]) => prepare(...args),
}))

vi.mock("../../lib/newsletter/generate-newsletter", () => ({
  generateNewsletterForArticle: (...args: unknown[]) => generateNewsletter(...args),
}))

vi.mock("../../lib/agents/publisher-agent", () => ({
  publisherAgent: (...args: unknown[]) => publish(...args),
}))

vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => ({
    chat: { completions: { create: (...args: unknown[]) => chatCreate(...args) } },
  }),
}))

function session(user: Record<string, unknown> | null) {
  mockGetUser.mockResolvedValue({ data: { user }, error: null })
}

function editor(role: "admin" | "editor" = "editor") {
  return {
    id: `${role}-1`,
    email: `${role}@example.com`,
    role: "authenticated",
    user_metadata: { role: "viewer" },
    app_metadata: { role },
  }
}

function post(path: string, body: unknown, headers?: HeadersInit) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
}

function expectNoSideEffects() {
  expect(articleCreate).not.toHaveBeenCalled()
  expect(updateArticle).not.toHaveBeenCalled()
  expect(prepare).not.toHaveBeenCalled()
  expect(transition).not.toHaveBeenCalled()
  expect(queueUpdate).not.toHaveBeenCalled()
  expect(newsletterUpdate).not.toHaveBeenCalled()
  expect(newsletterFindUnique).not.toHaveBeenCalled()
  expect(newsletterDelete).not.toHaveBeenCalled()
  expect(generateNewsletter).not.toHaveBeenCalled()
  expect(articleFindUnique).not.toHaveBeenCalled()
  expect(draftCreate).not.toHaveBeenCalled()
  expect(chatCreate).not.toHaveBeenCalled()
  expect(publish).not.toHaveBeenCalled()
}

describe("explicit editorial roles", () => {
  it.each(["admin", "editor"] as const)("allows an explicit %s", (role) => {
    expect(canPublishAsEditor(editor(role))).toBe(true)
  })

  it("denies an ordinary authenticated account", () => {
    expect(
      canPublishAsEditor({
        id: "user-1",
        email: "user@example.com",
        role: "authenticated",
      }),
    ).toBe(false)
  })

  it.each(["viewer", "reviewer", "anon", "owner", ""])(
    "denies role %s",
    (role) => {
      expect(
        canPublishAsEditor({
          id: "user-1",
          email: "user@example.com",
          role: "authenticated",
          app_metadata: { role },
        }),
      ).toBe(false)
    },
  )

  it("denies a missing role and client-controlled metadata", () => {
    expect(
      canPublishAsEditor({
        id: "user-1",
        email: "user@example.com",
        user_metadata: { role: "admin" },
      }),
    ).toBe(false)
  })
})

describe("editorial route bypasses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(editor())
    articleCreate.mockResolvedValue({ id: "article-1", status: "draft" })
    updateArticle.mockResolvedValue({
      ok: true,
      article: { id: "article-1", status: "draft" },
    })
    prepare.mockResolvedValue({
      ok: true,
      article: { id: "article-1" },
      audit: {},
      sourceDiagnostics: [],
    })
    transition.mockResolvedValue({
      ok: true,
      article: { id: "article-1" },
      alreadyApplied: false,
      articleUnchanged: false,
    })
    queueUpdate.mockResolvedValue({ id: "queue-1", status: "queued" })
    newsletterUpdate.mockResolvedValue({ id: "news-1", status: "approved" })
    newsletterFindUnique.mockResolvedValue({ id: "news-1", status: "draft" })
    newsletterDelete.mockResolvedValue({ id: "news-1" })
    generateNewsletter.mockResolvedValue({ ok: true, newsletter: { id: "news-1" } })
    articleFindUnique.mockResolvedValue({
      id: "article-1",
      title: "Title",
      excerpt: "Excerpt",
      content: "Content",
    })
    chatCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        subject: "Subject",
        previewText: "Preview",
        body: "Body",
      }) } }],
    })
    draftCreate.mockResolvedValue({ id: "draft-1" })
    publish.mockReturnValue({ ok: true })
  })

  const deniedUsers = [
    null,
    { id: "user-1", email: "user@example.com", role: "authenticated" },
    { id: "user-2", email: "user@example.com", user_metadata: { role: "admin" } },
    { id: "user-3", email: "user@example.com", app_metadata: { role: "owner" } },
  ]

  it.each(deniedUsers)(
    "blocks article creation before writing",
    async (user) => {
      session(user)
      const { POST } = await import("../../app/api/articles/route")
      const response = await POST(post("/api/articles", {
        title: "Draft",
        slug: "draft",
        category: "ai-tools",
        role: "admin",
      }))

      expect(response.status).toBe(user ? 403 : 401)
      await expect(response.json()).resolves.toEqual(
        user ? EDITOR_FORBIDDEN_BODY : AUTHENTICATION_REQUIRED_BODY,
      )
      expectNoSideEffects()
    },
  )

  it("creates a draft for an editor and still blocks governed initial statuses", async () => {
    const { POST } = await import("../../app/api/articles/route")
    const created = await POST(post("/api/articles", {
      title: "Draft",
      slug: "draft",
      category: "ai-tools",
    }))
    expect(created.status).toBe(200)
    expect(articleCreate).toHaveBeenCalledTimes(1)

    const blocked = await POST(post("/api/articles", {
      title: "Live",
      slug: "live",
      category: "ai-tools",
      status: "published",
    }))
    expect(blocked.status).toBe(409)
    expect(articleCreate).toHaveBeenCalledTimes(1)
  })

  it("blocks an ordinary user from article edits, review, archive, and rejection", async () => {
    session({ id: "user-1", email: "user@example.com", role: "authenticated" })
    const article = await import("../../app/api/articles/[id]/route")
    const review = await import("../../app/api/articles/prepare-for-review/route")
    const archive = await import("../../app/api/articles/archive/route")
    const reject = await import("../../app/api/articles/reject/route")

    const responses = await Promise.all([
      article.PATCH(post("/api/articles/article-1", { title: "Edited" }), {
        params: Promise.resolve({ id: "article-1" }),
      }),
      review.POST(post("/api/articles/prepare-for-review", { articleId: "article-1" })),
      archive.POST(post("/api/articles/archive", { articleId: "article-1" })),
      reject.POST(post("/api/articles/reject", { articleId: "article-1" })),
    ])

    for (const response of responses) {
      expect(response.status).toBe(403)
    }
    expectNoSideEffects()
  })

  it("lets an admin edit, prepare, archive, and reject", async () => {
    session(editor("admin"))
    const article = await import("../../app/api/articles/[id]/route")
    const review = await import("../../app/api/articles/prepare-for-review/route")
    const archive = await import("../../app/api/articles/archive/route")
    const reject = await import("../../app/api/articles/reject/route")

    expect((await article.PATCH(
      post("/api/articles/article-1", { title: "Edited" }),
      { params: Promise.resolve({ id: "article-1" }) },
    )).status).toBe(200)
    expect((await review.POST(
      post("/api/articles/prepare-for-review", { articleId: "article-1" }),
    )).status).toBe(200)
    expect((await archive.POST(
      post("/api/articles/archive", { articleId: "article-1" }),
    )).status).toBe(200)
    expect((await reject.POST(
      post("/api/articles/reject", { articleId: "article-1", rejectedBy: "spoofed" }),
    )).status).toBe(200)

    expect(prepare).toHaveBeenCalledWith("article-1", expect.objectContaining({
      reviewer: "admin@example.com",
    }))
    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({ actor: "admin@example.com", transition: "reject" }),
      expect.any(Object),
    )
  })

  it("keeps direct publication out of the queue update", async () => {
    const { POST } = await import("../../app/api/publishing/build-queue/route")
    const blocked = await POST(post("/api/publishing/build-queue", {
      queueId: "queue-1",
      status: "published",
    }))
    expect(blocked.status).toBe(409)
    expect(queueUpdate).not.toHaveBeenCalled()

    session({ id: "user-1", email: "user@example.com", role: "authenticated" })
    const denied = await POST(post("/api/publishing/build-queue", {
      queueId: "queue-1",
      status: "queued",
    }))
    expect(denied.status).toBe(403)
    expect(queueUpdate).not.toHaveBeenCalled()
  })

  it("blocks newsletter and publisher actions without an explicit role", async () => {
    session({
      id: "user-1",
      email: "user@example.com",
      role: "authenticated",
      user_metadata: { role: "editor" },
    })
    const approve = await import("../../app/api/newsletter/approve/route")
    const remove = await import("../../app/api/newsletter/delete/route")
    const generate = await import("../../app/api/newsletter/generate/route")
    const draft = await import("../../app/api/newsletter/generate-draft/route")
    const approveMany = await import("../../app/api/newsletters/approve/route")
    const rejectMany = await import("../../app/api/newsletters/reject/route")
    const publisher = await import("../../app/api/execution/publisher/route")

    const responses = await Promise.all([
      approve.POST(post("/api/newsletter/approve", {
        newsletterId: "news-1",
        approvedBy: "client",
      }, { "x-user-role": "admin" })),
      remove.POST(post("/api/newsletter/delete", { newsletterId: "news-1" })),
      generate.POST(post("/api/newsletter/generate", { articleId: "article-1" })),
      draft.POST(post("/api/newsletter/generate-draft", { articleId: "article-1" })),
      approveMany.POST(post("/api/newsletters/approve", { newsletterId: "news-1" })),
      rejectMany.POST(post("/api/newsletters/reject", { newsletterId: "news-1" })),
      publisher.POST(post("/api/execution/publisher", { title: "Title", mdxPath: "a.mdx" })),
    ])

    for (const response of responses) expect(response.status).toBe(403)
    expectNoSideEffects()
  })

  it("records the server actor when an editor approves a newsletter", async () => {
    const { POST } = await import("../../app/api/newsletter/approve/route")
    const response = await POST(post("/api/newsletter/approve", {
      newsletterId: "news-1",
      approvedBy: "client-supplied",
    }))

    expect(response.status).toBe(200)
    expect(newsletterUpdate).toHaveBeenCalledWith({
      where: { id: "news-1" },
      data: expect.objectContaining({
        status: "approved",
        approvedBy: "editor@example.com",
      }),
    })
  })
})

describe("cron authentication stays separate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session(null)
    vi.stubEnv("CRON_SECRET", "cron-test-secret")
  })

  it("accepts the cron secret without an editorial user", async () => {
    const { authorizeEditorOrCron } = await import("../../lib/publishing/require-editor-auth")
    const result = await authorizeEditorOrCron(new Request("http://localhost/api/cron/run-pipeline", {
      headers: { authorization: "Bearer cron-test-secret" },
    }))

    expect(result).toEqual({ ok: true, via: "cron" })
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it("does not accept a missing cron secret as an editor", async () => {
    vi.stubEnv("CRON_SECRET", "")
    const { authorizeEditorOrCron } = await import("../../lib/publishing/require-editor-auth")
    const result = await authorizeEditorOrCron(new Request("http://localhost/api/cron/run-pipeline", {
      headers: { authorization: "Bearer cron-test-secret" },
    }))

    expect(result.ok).toBe(false)
  })
})
