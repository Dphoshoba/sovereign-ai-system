/**
 * Duplicate / idempotency guards for YouTube recovery.
 * Mirrors SocialPost externalId short-circuit patterns without DB writes.
 */

export type YouTubeUploadIdentity = {
  youtubeVideoId?: string | null
  youtubeUrl?: string | null
  uploadStatus?: string | null
  shortsVideoId?: string | null
  shortsUploadUrl?: string | null
  shortsStatus?: string | null
}

export type DuplicateGuardResult =
  | { duplicate: true; reason: string; existingId: string; kind: "long-form" | "shorts" }
  | { duplicate: false }

export function guardLongFormReupload(
  post: YouTubeUploadIdentity,
): DuplicateGuardResult {
  if (post.youtubeVideoId?.trim()) {
    return {
      duplicate: true,
      reason: "youtubeVideoId already present",
      existingId: post.youtubeVideoId.trim(),
      kind: "long-form",
    }
  }
  if (post.uploadStatus === "uploaded" && post.youtubeUrl?.trim()) {
    return {
      duplicate: true,
      reason: "uploadStatus=uploaded with youtubeUrl",
      existingId: post.youtubeUrl.trim(),
      kind: "long-form",
    }
  }
  return { duplicate: false }
}

export function guardShortsReupload(
  post: YouTubeUploadIdentity,
): DuplicateGuardResult {
  if (post.shortsVideoId?.trim()) {
    return {
      duplicate: true,
      reason: "shortsVideoId already present",
      existingId: post.shortsVideoId.trim(),
      kind: "shorts",
    }
  }
  if (post.shortsStatus === "uploaded" && post.shortsUploadUrl?.trim()) {
    return {
      duplicate: true,
      reason: "shortsStatus=uploaded with shortsUploadUrl",
      existingId: post.shortsUploadUrl.trim(),
      kind: "shorts",
    }
  }
  return { duplicate: false }
}
