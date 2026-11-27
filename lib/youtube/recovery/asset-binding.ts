/**
 * I2 video asset binding helpers — additive to existing distribution-scope /
 * publication-package fingerprints. Does not mutate Production contracts.
 */

import { createHash } from "node:crypto"
import fs from "node:fs"

export const YOUTUBE_ASSET_BIND_ACTION = "youtube-asset-bind"

export type YouTubeAssetBindingPayload = {
  v: 1
  articleId: string
  youtubePostId: string
  packageFingerprint: string
  contentFingerprint?: string
  longForm: {
    videoPath?: string | null
    videoSha256?: string | null
    thumbnailPath?: string | null
    thumbnailSha256?: string | null
    title: string
    description: string
  }
  shorts?: {
    videoPath?: string | null
    videoSha256?: string | null
    caption?: string | null
  } | null
  voiceoverPath?: string | null
  voiceoverSha256?: string | null
  boundAt: string
  boundBy: string
}

export function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath)
  return createHash("sha256").update(buf).digest("hex")
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

export function buildYouTubeAssetBinding(
  input: Omit<YouTubeAssetBindingPayload, "v" | "boundAt"> & {
    boundAt?: string
  },
): YouTubeAssetBindingPayload {
  return {
    v: 1,
    articleId: input.articleId,
    youtubePostId: input.youtubePostId,
    packageFingerprint: input.packageFingerprint,
    contentFingerprint: input.contentFingerprint,
    longForm: input.longForm,
    shorts: input.shorts ?? null,
    voiceoverPath: input.voiceoverPath,
    voiceoverSha256: input.voiceoverSha256,
    boundAt: input.boundAt || new Date().toISOString(),
    boundBy: input.boundBy,
  }
}

export function serializeYouTubeAssetBinding(
  payload: YouTubeAssetBindingPayload,
): string {
  return JSON.stringify(payload)
}

export function parseYouTubeAssetBinding(
  note: string | null | undefined,
): YouTubeAssetBindingPayload | null {
  if (!note) return null
  try {
    const parsed = JSON.parse(note) as YouTubeAssetBindingPayload
    if (parsed?.v !== 1) return null
    if (typeof parsed.youtubePostId !== "string") return null
    if (typeof parsed.packageFingerprint !== "string") return null
    if (!parsed.longForm || typeof parsed.longForm.title !== "string") return null
    return parsed
  } catch {
    return null
  }
}

/**
 * True when bound video asset hashes still match files on disk.
 * Missing optional paths are treated as not applicable (pass).
 */
export function verifyBoundYouTubeAssets(
  payload: YouTubeAssetBindingPayload,
): { ok: true } | { ok: false; mismatch: string } {
  const checks: Array<{ label: string; path?: string | null; sha?: string | null }> = [
    {
      label: "longForm.video",
      path: payload.longForm.videoPath,
      sha: payload.longForm.videoSha256,
    },
    {
      label: "longForm.thumbnail",
      path: payload.longForm.thumbnailPath,
      sha: payload.longForm.thumbnailSha256,
    },
    {
      label: "voiceover",
      path: payload.voiceoverPath,
      sha: payload.voiceoverSha256,
    },
    {
      label: "shorts.video",
      path: payload.shorts?.videoPath,
      sha: payload.shorts?.videoSha256,
    },
  ]

  for (const check of checks) {
    if (!check.path || !check.sha) continue
    if (!fs.existsSync(check.path)) {
      return { ok: false, mismatch: `${check.label} missing on disk` }
    }
    const actual = sha256File(check.path)
    if (actual !== check.sha) {
      return { ok: false, mismatch: `${check.label} sha256 mismatch` }
    }
  }
  return { ok: true }
}
