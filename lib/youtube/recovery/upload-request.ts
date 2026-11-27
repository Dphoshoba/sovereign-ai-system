/**
 * Pure YouTube upload request construction for local/worker recovery.
 * Does not call the YouTube API. Safe for unit tests and dry-run workers.
 */

import path from "node:path"

export type YouTubeUploadPrivacy = "private" | "unlisted" | "public"

export type YouTubeLongFormUploadDraft = {
  youtubePostId: string
  title: string
  description: string
  tags: string[]
  privacyStatus: YouTubeUploadPrivacy
  publishAt?: string
  videoPath: string
  thumbnailPath?: string
}

export type YouTubeShortsUploadDraft = {
  youtubePostId: string
  title: string
  description: string
  privacyStatus: YouTubeUploadPrivacy
  videoPath: string
}

export function parseYouTubeTags(tags: string | null | undefined): string[] {
  if (!tags?.trim()) return []
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

export function resolvePublicMediaPath(
  cwd: string,
  publicUrl: string | null | undefined,
): string | null {
  if (!publicUrl?.trim()) return null
  const relative = publicUrl.replace(/^\//, "")
  return path.join(cwd, "public", relative)
}

export function buildLongFormUploadDraft(input: {
  youtubePostId: string
  title: string
  description?: string | null
  tags?: string | null
  scheduledFor?: Date | string | null
  renderedVideoUrl?: string | null
  thumbnailImage?: string | null
  cwd: string
  fallbackVideoUrl?: string
  privacyStatus?: YouTubeUploadPrivacy
}): YouTubeLongFormUploadDraft {
  const videoPublic =
    input.renderedVideoUrl || input.fallbackVideoUrl || "/test-video.mp4"
  const videoPath = resolvePublicMediaPath(input.cwd, videoPublic)
  if (!videoPath) {
    throw new Error("Unable to resolve long-form video path")
  }

  const thumbnailPath = input.thumbnailImage
    ? resolvePublicMediaPath(input.cwd, input.thumbnailImage) ?? undefined
    : undefined

  const publishAt = input.scheduledFor
    ? new Date(input.scheduledFor).toISOString()
    : undefined

  return {
    youtubePostId: input.youtubePostId,
    title: input.title,
    description: input.description || "",
    tags: parseYouTubeTags(input.tags),
    privacyStatus: input.privacyStatus || "private",
    publishAt,
    videoPath,
    thumbnailPath,
  }
}

export function buildShortsUploadDraft(input: {
  youtubePostId: string
  title: string
  shortsCaption?: string | null
  shortsVideoUrl?: string | null
  cwd: string
  privacyStatus?: YouTubeUploadPrivacy
}): YouTubeShortsUploadDraft {
  if (!input.shortsVideoUrl) {
    throw new Error("Shorts video not rendered")
  }
  const videoPath = resolvePublicMediaPath(input.cwd, input.shortsVideoUrl)
  if (!videoPath) {
    throw new Error("Unable to resolve Shorts video path")
  }

  return {
    youtubePostId: input.youtubePostId,
    title: `${input.title} #Shorts`,
    description: input.shortsCaption || "",
    privacyStatus: input.privacyStatus || "private",
    videoPath,
  }
}

/** Maps a draft to the googleapis videos.insert requestBody shape (no media body). */
export function toVideosInsertRequestBody(
  draft: YouTubeLongFormUploadDraft | YouTubeShortsUploadDraft,
) {
  return {
    part: ["snippet", "status"] as const,
    requestBody: {
      snippet: {
        title: draft.title,
        description: draft.description,
        ...("tags" in draft ? { tags: draft.tags } : {}),
      },
      status: {
        privacyStatus: draft.privacyStatus,
        ...("publishAt" in draft && draft.publishAt
          ? { publishAt: draft.publishAt }
          : {}),
      },
    },
  }
}
