import { describe, expect, it, vi } from "vitest"
import { publishAuthorisedXAfterScheduledPublish } from "../../lib/social/after-scheduled-publish-x"
import {
  ORDINARY_WORK_ARTICLE_ID,
  resolveAuthorisedChannels,
} from "../../lib/publishing/distribution-scope"
import {
  buildPublicationPackage,
  bindDistributionScopeNote,
} from "../../lib/publishing/publication-package"

describe("distribution scope governance", () => {
  it("maps Ordinary Work to X-only and never newsletter", () => {
    const resolved = resolveAuthorisedChannels({
      articleId: ORDINARY_WORK_ARTICLE_ID,
      reviewNotes: [],
    })
    expect(resolved.channels).toEqual(["x"])
    expect(resolved.channels).not.toContain("newsletter")
    expect(resolved.source).toBe("ordinary-work-legacy")
  })

  it("requires re-approval when package fingerprint changes", () => {
    const bound = bindDistributionScopeNote({
      articleId: "art-1",
      channels: ["x", "newsletter"],
      packageFingerprint: "aaa",
      contentFingerprint: "ccc",
      actor: "editor",
    })
    const resolved = resolveAuthorisedChannels({
      articleId: "art-1",
      reviewNotes: [{ action: bound.action, note: bound.note }],
      currentPackageFingerprint: "bbb",
    })
    expect(resolved.stale).toBe(true)
    expect(resolved.channels).toEqual([])
  })

  it("marks package incomplete without newsletter when channel requested", () => {
    const pkg = buildPublicationPackage({
      article: {
        id: "art-1",
        title: "T",
        slug: "t",
        status: "approved",
        excerpt: "e",
        content: "body",
        featuredImage: "https://example.com/i.jpg",
        seoTitle: "seo",
        seoDescription: "desc",
        seoKeywords: "k",
        scheduledFor: "2026-12-02T20:30:00.000Z",
        reviewNotes: [],
      },
      contentFingerprint: "fp",
      evidenceSummary: {
        auditId: "audit-1",
        recommendation: "publish-ready",
        consensusScore: 84,
        sourceQualityScore: 85,
      },
      xAnnouncement: {
        id: "x-1",
        content: "Hello https://www.echoesandvisions.com/blog/t",
        status: "approved",
      },
      newsletter: null,
      requestedChannels: ["x", "newsletter"],
    })
    expect(pkg.complete).toBe(false)
    expect(pkg.missing).toContain("newsletter")
  })
})

describe("publishAuthorisedXAfterScheduledPublish", () => {
  const article = {
    id: ORDINARY_WORK_ARTICLE_ID,
    slug: "faithful-in-ordinary-work-purpose-when-your-role-feels-small",
    status: "published",
    featuredImage: "https://cdn.example.com/img.jpg",
    reviewNotes: [],
  }

  it("fails closed when public verify fails and does not publish", async () => {
    const tweet = vi.fn()
    const result = await publishAuthorisedXAfterScheduledPublish({
      article,
      socialPosts: [
        {
          id: "x-1",
          platform: "twitter",
          content: "copy",
          status: "approved",
          externalId: null,
        },
      ],
      store: {} as never,
      createClient: () => ({ v2: { me: async () => ({ data: { id: "1" } }), tweet } }),
      fetchImpl: async () => new Response("nope", { status: 404 }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("public_verify_failed")
    expect(tweet).not.toHaveBeenCalled()
  })

  it("does not regenerate when no approved X exists", async () => {
    const result = await publishAuthorisedXAfterScheduledPublish({
      article,
      socialPosts: [
        {
          id: "x-1",
          platform: "twitter",
          content: "draft",
          status: "review-required",
          externalId: null,
        },
      ],
      store: {} as never,
      createClient: () => ({
        v2: {
          me: async () => ({ data: { id: "2330006420" } }),
          tweet: async () => ({ data: { id: "1" } }),
        },
      }),
      fetchImpl: async () => new Response("ok", { status: 200 }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("no_approved_x")
  })

  it("treats multiple approved X posts as ambiguous", async () => {
    const result = await publishAuthorisedXAfterScheduledPublish({
      article,
      socialPosts: [
        {
          id: "x-1",
          platform: "twitter",
          content: "a",
          status: "approved",
          externalId: null,
        },
        {
          id: "x-2",
          platform: "twitter",
          content: "b",
          status: "approved",
          externalId: null,
        },
      ],
      store: {} as never,
      createClient: () => ({
        v2: {
          me: async () => ({ data: { id: "2330006420" } }),
          tweet: async () => ({ data: { id: "1" } }),
        },
      }),
      fetchImpl: async () => new Response("ok", { status: 200 }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe("ambiguous_approved_x")
  })

  it("skips when channel is not authorised", async () => {
    const result = await publishAuthorisedXAfterScheduledPublish({
      article: { ...article, id: "other-article", reviewNotes: [] },
      socialPosts: [
        {
          id: "x-1",
          platform: "twitter",
          content: "a",
          status: "approved",
          externalId: null,
        },
      ],
      store: {} as never,
      createClient: () => ({
        v2: {
          me: async () => ({ data: { id: "2330006420" } }),
          tweet: async () => ({ data: { id: "1" } }),
        },
      }),
      fetchImpl: async () => new Response("ok", { status: 200 }),
    })
    expect(result).toMatchObject({ ok: true, skipped: true })
  })
})
