import { describe, expect, it, vi } from "vitest"
import {
  extractLinkedInPostId,
  LINKEDIN_API_VERSION,
  LINKEDIN_POSTS_CREATE_URL,
  publishApprovedLinkedInPost,
  buildLinkedInPostBody,
} from "../../lib/social/linkedin-publish"
import { publishAuthorisedLinkedInAfterScheduledPublish } from "../../lib/social/after-scheduled-publish-linkedin"
import {
  ORDINARY_WORK_ARTICLE_ID,
  resolveAuthorisedChannels,
  channelAuthorised,
} from "../../lib/publishing/distribution-scope"
import { bindDistributionScopeNote } from "../../lib/publishing/publication-package"

describe("LinkedIn API compatibility helpers", () => {
  it("targets /rest/posts with a current LinkedIn-Version", () => {
    expect(LINKEDIN_POSTS_CREATE_URL).toBe("https://api.linkedin.com/rest/posts")
    expect(LINKEDIN_API_VERSION).toMatch(/^\d{6}$/)
    expect(Number(LINKEDIN_API_VERSION)).toBeGreaterThanOrEqual(202503)
  })

  it("extracts post URN from x-restli-id when body is empty", () => {
    const response = new Response("", {
      status: 201,
      headers: { "x-restli-id": "urn:li:share:123" },
    })
    expect(extractLinkedInPostId(response, null)).toBe("urn:li:share:123")
  })

  it("falls back to JSON id when header missing", () => {
    const response = new Response("{}", { status: 201 })
    expect(extractLinkedInPostId(response, { id: "urn:li:ugcPost:9" })).toBe(
      "urn:li:ugcPost:9",
    )
  })

  it("builds Posts API body with member author", () => {
    const body = buildLinkedInPostBody({
      authorUrn: "urn:li:person:abc",
      commentary: "Hello",
    })
    expect(body.author).toBe("urn:li:person:abc")
    expect(body.lifecycleState).toBe("PUBLISHED")
    expect(body.visibility).toBe("PUBLIC")
  })
})

describe("OW LinkedIn exclusion", () => {
  it("never authorises LinkedIn for Ordinary Work", () => {
    const resolved = resolveAuthorisedChannels({
      articleId: ORDINARY_WORK_ARTICLE_ID,
      reviewNotes: [],
    })
    expect(channelAuthorised(resolved.scope, "linkedin")).toBe(false)
  })
})

describe("publishApprovedLinkedInPost safeguards", () => {
  const basePost = {
    id: "li-1",
    platform: "linkedin",
    content:
      "Announcement https://www.echoesandvisions.com/blog/demo-slug",
    status: "approved",
    externalId: null,
    articleId: "art-1",
    article: {
      id: "art-1",
      status: "published",
      slug: "demo-slug",
      featuredImage: "https://cdn.example.com/i.jpg",
    },
  }

  it("blocks Preview live LinkedIn publish", async () => {
    const prev = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = "preview"
    try {
      const result = await publishApprovedLinkedInPost({
        postId: "li-1",
        store: {
          socialPost: {
            findUnique: async () => basePost,
            update: async () => basePost,
          },
          externalIntegration: {
            findUnique: async () => null,
          },
          operationalEvent: { create: async () => ({}) },
        },
      })
      expect(result.status).toBe(403)
      expect(result.body.code).toBe("preview_blocked")
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })

  it("fails closed when LinkedIn is not connected", async () => {
    const prev = process.env.VERCEL_ENV
    delete process.env.VERCEL_ENV
    try {
      const result = await publishApprovedLinkedInPost({
        postId: "li-1",
        store: {
          socialPost: {
            findUnique: async () => basePost,
            update: async () => basePost,
          },
          externalIntegration: {
            findUnique: async () => null,
          },
          operationalEvent: { create: async () => ({}) },
        },
      })
      expect(result.status).toBe(503)
      expect(result.body.code).toBe("not_connected")
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })

  it("treats success without identifier as ambiguous and does not mark published", async () => {
    const prev = process.env.VERCEL_ENV
    delete process.env.VERCEL_ENV
    const update = vi.fn()
    const createEvent = vi.fn(async () => ({}))
    try {
      const result = await publishApprovedLinkedInPost({
        postId: "li-1",
        store: {
          socialPost: {
            findUnique: async () => basePost,
            update,
          },
          externalIntegration: {
            findUnique: async () => ({
              name: "LinkedIn",
              enabled: true,
              status: "connected",
              config: {
                accessToken: "token",
                memberUrn: "urn:li:person:abc",
                expiresAt: new Date(Date.now() + 60_000).toISOString(),
              },
            }),
          },
          operationalEvent: { create: createEvent },
        },
        fetchImpl: async () => new Response("", { status: 201 }),
      })
      expect(result.status).toBe(502)
      expect(result.body.code).toBe("ambiguous_response")
      expect(update).not.toHaveBeenCalled()
      expect(createEvent).toHaveBeenCalled()
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })

  it("records published when x-restli-id is present", async () => {
    const prev = process.env.VERCEL_ENV
    delete process.env.VERCEL_ENV
    const updated = {
      ...basePost,
      status: "published",
      externalId: "urn:li:share:999",
    }
    try {
      const result = await publishApprovedLinkedInPost({
        postId: "li-1",
        store: {
          socialPost: {
            findUnique: async () => basePost,
            update: async () => updated,
          },
          externalIntegration: {
            findUnique: async () => ({
              name: "LinkedIn",
              enabled: true,
              status: "connected",
              config: {
                accessToken: "token",
                memberUrn: "urn:li:person:abc",
                expiresAt: new Date(Date.now() + 60_000).toISOString(),
              },
            }),
          },
          operationalEvent: { create: async () => ({}) },
        },
        fetchImpl: async (url) => {
          expect(String(url)).toBe(LINKEDIN_POSTS_CREATE_URL)
          return new Response("", {
            status: 201,
            headers: { "x-restli-id": "urn:li:share:999" },
          })
        },
      })
      expect(result.status).toBe(200)
      expect(result.body.ok).toBe(true)
      expect(result.body.externalId).toBe("urn:li:share:999")
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })
})

describe("publishAuthorisedLinkedInAfterScheduledPublish", () => {
  it("skips when LinkedIn is not in distribution scope", async () => {
    const result = await publishAuthorisedLinkedInAfterScheduledPublish({
      article: {
        id: ORDINARY_WORK_ARTICLE_ID,
        slug: "faithful-in-ordinary-work-purpose-when-your-role-feels-small",
        status: "published",
        featuredImage: "https://cdn.example.com/img.jpg",
        reviewNotes: [],
      },
      socialPosts: [
        {
          id: "li-1",
          platform: "linkedin",
          content: "copy",
          status: "approved",
          externalId: null,
        },
      ],
      store: {} as never,
      fetchImpl: async () => new Response("ok", { status: 200 }),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.skipped).toBe(true)
    }
  })

  it("fails closed when multiple approved LinkedIn posts exist", async () => {
    const bound = bindDistributionScopeNote({
      articleId: "art-li",
      channels: ["linkedin"],
      packageFingerprint: "fp",
      contentFingerprint: "cfp",
      actor: "editor",
    })
    const result = await publishAuthorisedLinkedInAfterScheduledPublish({
      article: {
        id: "art-li",
        slug: "demo-slug",
        status: "published",
        featuredImage: "https://cdn.example.com/img.jpg",
        reviewNotes: [{ action: bound.action, note: bound.note }],
      },
      socialPosts: [
        {
          id: "li-1",
          platform: "linkedin",
          content: "a https://www.echoesandvisions.com/blog/demo-slug",
          status: "approved",
          externalId: null,
        },
        {
          id: "li-2",
          platform: "linkedin",
          content: "b https://www.echoesandvisions.com/blog/demo-slug",
          status: "approved",
          externalId: null,
        },
      ],
      store: {} as never,
      fetchImpl: async () => new Response("ok", { status: 200 }),
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe("ambiguous_approved_linkedin")
    }
  })
})
