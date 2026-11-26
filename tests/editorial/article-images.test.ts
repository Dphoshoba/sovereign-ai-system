import { afterEach, describe, expect, it, vi } from "vitest"
import {
  MAX_FEATURED_IMAGE_BYTES,
  buildArticleImageObjectPath,
  canWriteLocalPublicGenerated,
  persistFeaturedImageBytes,
  sanitizeArticleSlug,
  validateFeaturedImageBytes,
} from "../../lib/storage/article-images"

export const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
)

describe("featured image path and payload validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("sanitizes slugs and rejects traversal characters in the object path", () => {
    expect(sanitizeArticleSlug("../../etc/passwd")).toBe("etc-passwd")
    expect(sanitizeArticleSlug("AI Automation For Creators!")).toBe(
      "ai-automation-for-creators"
    )

    const objectPath = buildArticleImageObjectPath({
      slug: "../../etc/passwd",
      articleId: "article-1",
      mimeType: "image/png",
    })

    expect(objectPath.startsWith("etc-passwd/")).toBe(true)
    expect(objectPath.endsWith(".png")).toBe(true)
    expect(objectPath).not.toContain("..")
    expect(objectPath.split("/")).toHaveLength(2)
  })

  it("uses the article id when the slug sanitizes to empty", () => {
    const objectPath = buildArticleImageObjectPath({
      slug: "***",
      articleId: "art_99",
      mimeType: "image/png",
    })

    expect(objectPath.startsWith("art-99/")).toBe(true)
  })

  it("rejects invalid image payload, type, and size", () => {
    expect(validateFeaturedImageBytes(Buffer.alloc(0), "image/png")).toEqual({
      ok: false,
      error: "Empty image payload",
    })
    expect(validateFeaturedImageBytes(Buffer.from("not-a-png"), "image/png")).toEqual({
      ok: false,
      error: "Invalid PNG payload",
    })
    expect(validateFeaturedImageBytes(MINIMAL_PNG, "image/jpeg")).toEqual({
      ok: false,
      error: "Unsupported image type",
    })
    expect(
      validateFeaturedImageBytes(
        Buffer.concat([MINIMAL_PNG, Buffer.alloc(MAX_FEATURED_IMAGE_BYTES)]),
        "image/png"
      )
    ).toEqual({
      ok: false,
      error: "Image exceeds maximum size",
    })
    expect(validateFeaturedImageBytes(MINIMAL_PNG, "image/png")).toEqual({
      ok: true,
      mimeType: "image/png",
    })
  })

  it("never allows local public/generated writes on Vercel or production", () => {
    vi.stubEnv("VERCEL", "1")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    expect(canWriteLocalPublicGenerated()).toBe(false)

    vi.unstubAllEnvs()
    vi.stubEnv("VERCEL", "")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")
    expect(canWriteLocalPublicGenerated()).toBe(false)
  })

  it("does not update storage when the payload is invalid", async () => {
    const upload = vi.fn()

    const result = await persistFeaturedImageBytes({
      articleId: "article-1",
      slug: "safe-slug",
      bytes: Buffer.from("nope"),
      mimeType: "image/png",
      upload,
    })

    expect(result).toEqual({
      ok: false,
      error: "Invalid PNG payload",
    })
    expect(upload).not.toHaveBeenCalled()
  })

  it("returns a generic upload failure and does not invent a URL", async () => {
    const result = await persistFeaturedImageBytes({
      articleId: "article-1",
      slug: "safe-slug",
      bytes: MINIMAL_PNG,
      mimeType: "image/png",
      upload: async () => {
        throw new Error("storage denied")
      },
    })

    expect(result).toEqual({
      ok: false,
      error: "Image upload failed",
    })
  })
})
