import { describe, expect, it, vi } from "vitest"
import { sendAuthorisedNewsletterAfterScheduledPublish } from "../../lib/newsletter/after-scheduled-publish-newsletter"
import {
  ORDINARY_WORK_ARTICLE_ID,
  resolveAuthorisedChannels,
} from "../../lib/publishing/distribution-scope"
import { bindDistributionScopeNote } from "../../lib/publishing/publication-package"

function article(overrides: Record<string, unknown> = {}) {
  return {
    id: "art-nl-1",
    slug: "living-beyond-the-present-the-power-of-a-god-given-vision",
    status: "published",
    featuredImage: "https://example.com/featured.jpg",
    reviewNotes: [] as Array<{ action: string; note: string | null }>,
    ...overrides,
  }
}

function bindNewsletterScope(articleId = "art-nl-1") {
  const bound = bindDistributionScopeNote({
    articleId,
    channels: ["x", "newsletter", "linkedin"],
    packageFingerprint: "pkg-1",
    contentFingerprint: "fp-1",
    actor: "director-i2",
  })
  return [{ action: bound.action, note: bound.note }]
}

describe("after-scheduled-publish-newsletter", () => {
  it("keeps Ordinary Work without newsletter channel", () => {
    const resolved = resolveAuthorisedChannels({
      articleId: ORDINARY_WORK_ARTICLE_ID,
      reviewNotes: [],
    })
    expect(resolved.channels).toEqual(["x"])
    expect(resolved.channels).not.toContain("newsletter")
  })

  it("skips send when newsletter not in scope", async () => {
    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article(),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "approved",
          subject: "S",
        },
      ],
      store: {} as never,
      env: { VERCEL_ENV: "production" },
      fetchImpl: vi.fn(),
    })
    expect(result).toMatchObject({ ok: true, skipped: true })
  })

  it("fails closed without approved newsletter when channel authorised", async () => {
    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article({ reviewNotes: bindNewsletterScope() }),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "review-required",
          subject: "S",
        },
      ],
      store: {} as never,
      env: { VERCEL_ENV: "production" },
      fetchImpl: async () => ({ status: 200, ok: true }) as Response,
    })
    expect(result).toMatchObject({ ok: false, code: "no_approved_newsletter" })
  })

  it("fails when public verify fails", async () => {
    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article({ reviewNotes: bindNewsletterScope() }),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "approved",
          subject: "S",
        },
      ],
      store: {} as never,
      env: { VERCEL_ENV: "production" },
      fetchImpl: async (url) => {
        if (String(url).includes("/blog/")) {
          return { status: 404, ok: false } as Response
        }
        return { status: 200, ok: true } as Response
      },
    })
    expect(result).toMatchObject({ ok: false, code: "public_verify_failed" })
  })

  it("fails when featured image verify fails", async () => {
    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article({
        reviewNotes: bindNewsletterScope(),
        featuredImage: "https://example.com/missing.jpg",
      }),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "approved",
          subject: "S",
        },
      ],
      store: {} as never,
      env: { VERCEL_ENV: "production" },
      fetchImpl: async (url) => {
        if (String(url).includes("missing.jpg")) {
          return { status: 404, ok: false } as Response
        }
        return { status: 200, ok: true } as Response
      },
    })
    expect(result).toMatchObject({
      ok: false,
      code: "featured_image_verify_failed",
    })
  })

  it("blocks Preview live list send", async () => {
    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article({ reviewNotes: bindNewsletterScope() }),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "approved",
          subject: "S",
        },
      ],
      store: {} as never,
      env: { VERCEL_ENV: "preview" },
      fetchImpl: vi.fn(),
    })
    expect(result).toMatchObject({ ok: false, code: "preview_blocked" })
  })

  it("sends approved newsletter after public + image verify", async () => {
    const send = vi.fn(async () => ({
      data: { id: "msg_1" },
      error: null,
    }))
    const store = {
      newsletter: {
        findUnique: async () => ({
          id: "nl-1",
          status: "approved",
          subject: "Living Beyond",
          previewText: "Preview",
          content: "<p>Body with CTA</p>",
        }),
        update: async () => ({
          id: "nl-1",
          status: "sent",
          subject: "Living Beyond",
          previewText: "Preview",
          content: "<p>Body with CTA</p>",
        }),
      },
      subscriber: {
        findMany: async () => [
          { id: "sub-1", email: "a@example.com", status: "active" },
        ],
      },
      operationalEvent: {
        findMany: async () => [],
        create: async () => ({}),
      },
    }

    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article({ reviewNotes: bindNewsletterScope() }),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "approved",
          subject: "Living Beyond",
        },
      ],
      store: store as never,
      env: {
        VERCEL_ENV: "production",
        NEWSLETTER_RESEND_API_KEY: "re_test",
        NEWSLETTER_FROM:
          "Echoes & Visions <newsletter@news.echoesandvisions.com>",
      },
      fetchImpl: async () => ({ status: 200, ok: true }) as Response,
      createClient: () => ({ emails: { send } }),
    })

    expect(result.ok).toBe(true)
    if (result.ok && !result.skipped) {
      expect(result.newsletterId).toBe("nl-1")
    }
    expect(send).toHaveBeenCalled()
  })

  it("does not invent newsletter when none approved; ambiguous fails", async () => {
    const result = await sendAuthorisedNewsletterAfterScheduledPublish({
      article: article({ reviewNotes: bindNewsletterScope() }),
      newsletters: [
        {
          id: "nl-1",
          articleId: "art-nl-1",
          status: "approved",
          subject: "A",
        },
        {
          id: "nl-2",
          articleId: "art-nl-1",
          status: "approved",
          subject: "B",
        },
      ],
      store: {} as never,
      env: { VERCEL_ENV: "production" },
      fetchImpl: async () => ({ status: 200, ok: true }) as Response,
    })
    expect(result).toMatchObject({
      ok: false,
      code: "ambiguous_approved_newsletter",
    })
  })
})
