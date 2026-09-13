import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export const ARTICLE_IMAGES_BUCKET = "article-images"
export const MAX_FEATURED_IMAGE_BYTES = 8 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = {
  "image/png": "png",
} as const

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export type AllowedFeaturedImageMime = keyof typeof ALLOWED_IMAGE_TYPES

export function getArticleImagesBucket() {
  const fromEnv = process.env.ARTICLE_IMAGES_BUCKET?.trim()
  return fromEnv || ARTICLE_IMAGES_BUCKET
}

export function isReadOnlyDeployFilesystem() {
  const cwd = process.cwd().replace(/\\/g, "/")
  return Boolean(process.env.VERCEL) || cwd === "/var/task" || cwd.startsWith("/var/task/")
}

export function canWriteLocalPublicGenerated() {
  if (isReadOnlyDeployFilesystem()) return false
  if (process.env.NODE_ENV === "production") return false
  return !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
}

export function sanitizeArticleSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function buildArticleImageObjectPath(input: {
  slug: string
  articleId: string
  mimeType: string
}) {
  const extension =
    ALLOWED_IMAGE_TYPES[input.mimeType as AllowedFeaturedImageMime]

  if (!extension) {
    throw new Error("Unsupported image type")
  }

  const fromSlug = sanitizeArticleSlug(input.slug)
  const fromId = sanitizeArticleSlug(input.articleId)
  const folder = fromSlug || fromId || "article"

  if (
    folder.includes("/") ||
    folder.includes("\\") ||
    folder.includes("..") ||
    folder.length === 0
  ) {
    throw new Error("Invalid storage path")
  }

  return `${folder}/${randomUUID()}.${extension}`
}

export function validateFeaturedImageBytes(
  bytes: Buffer,
  mimeType: string
): { ok: true; mimeType: AllowedFeaturedImageMime } | { ok: false; error: string } {
  if (!Buffer.isBuffer(bytes) || bytes.byteLength === 0) {
    return { ok: false, error: "Empty image payload" }
  }

  if (bytes.byteLength > MAX_FEATURED_IMAGE_BYTES) {
    return { ok: false, error: "Image exceeds maximum size" }
  }

  if (!(mimeType in ALLOWED_IMAGE_TYPES)) {
    return { ok: false, error: "Unsupported image type" }
  }

  if (mimeType === "image/png" && !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { ok: false, error: "Invalid PNG payload" }
  }

  return { ok: true, mimeType: mimeType as AllowedFeaturedImageMime }
}

function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function uploadToLocalPublicGenerated(
  objectPath: string,
  bytes: Buffer
): Promise<string> {
  const generatedDir = path.join(process.cwd(), "public", "generated")
  await mkdir(generatedDir, { recursive: true })
  const fileName = objectPath.replaceAll("/", "-")
  await writeFile(path.join(generatedDir, fileName), bytes)
  return `/generated/${fileName}`
}

export async function uploadFeaturedImageBytes(input: {
  bytes: Buffer
  objectPath: string
  mimeType: AllowedFeaturedImageMime
}): Promise<string> {
  if (isReadOnlyDeployFilesystem() || process.env.NODE_ENV === "production") {
    if (canWriteLocalPublicGenerated()) {
      throw new Error("Local filesystem image writes are disabled in production")
    }
  }

  if (canWriteLocalPublicGenerated()) {
    return uploadToLocalPublicGenerated(input.objectPath, input.bytes)
  }

  const client = createServiceRoleClient()
  const bucket = getArticleImagesBucket()
  const { error } = await client.storage.from(bucket).upload(input.objectPath, input.bytes, {
    contentType: input.mimeType,
    upsert: false,
  })

  if (error) {
    throw new Error("Image upload failed")
  }

  const { data } = client.storage.from(bucket).getPublicUrl(input.objectPath)
  if (!data.publicUrl) {
    throw new Error("Image upload failed")
  }

  return data.publicUrl
}

export async function persistFeaturedImageBytes(input: {
  articleId: string
  slug: string
  bytes: Buffer
  mimeType?: string
  upload?: typeof uploadFeaturedImageBytes
}): Promise<{ ok: true; imageUrl: string; objectPath: string } | { ok: false; error: string }> {
  const mimeType = input.mimeType ?? "image/png"
  const validated = validateFeaturedImageBytes(input.bytes, mimeType)

  if (!validated.ok) {
    return validated
  }

  let objectPath: string
  try {
    objectPath = buildArticleImageObjectPath({
      slug: input.slug,
      articleId: input.articleId,
      mimeType: validated.mimeType,
    })
  } catch {
    return { ok: false, error: "Invalid storage path" }
  }

  const upload = input.upload ?? uploadFeaturedImageBytes

  try {
    const imageUrl = await upload({
      bytes: input.bytes,
      objectPath,
      mimeType: validated.mimeType,
    })
    return { ok: true, imageUrl, objectPath }
  } catch {
    return { ok: false, error: "Image upload failed" }
  }
}
