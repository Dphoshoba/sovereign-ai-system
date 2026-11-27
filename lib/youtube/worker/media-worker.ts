/**
 * Minimal dedicated YouTube media worker for local / self-hosted operation.
 * Reuses AiJob claiming + OperationalEvent outcomes — not a second execution engine.
 * Vercel heavy render/upload routes remain disabled.
 */

import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import {
  buildYouTubeAssetBinding,
  sha256File,
  verifyBoundYouTubeAssets,
  type YouTubeAssetBindingPayload,
} from "../recovery/asset-binding"
import {
  guardLongFormReupload,
  guardShortsReupload,
} from "../recovery/duplicate-guards"
import {
  buildChannelClaimId,
  classifyProviderTimeoutAsAmbiguous,
  shouldBlockRetry,
  type ChannelExecutionClaim,
  type ChannelExecutionOutcome,
} from "../../publishing/channel-execution-guard"
import {
  createFixtureThumbnail,
  createMinimalAvFixtures,
  ensureR1FixtureDir,
  runFfmpeg,
} from "../recovery/local-render-fixtures"

export const YOUTUBE_WORKER_JOB_TYPES = [
  "youtube-prepare",
  "youtube-upload-long",
  "youtube-upload-shorts",
  "youtube-health",
] as const

export type YoutubeWorkerJobType = (typeof YOUTUBE_WORKER_JOB_TYPES)[number]

export type YoutubeWorkerJob = {
  id: string
  type: YoutubeWorkerJobType | string
  status: string
  payload?: Record<string, unknown> | null
  scheduledAt?: Date | string | null
  claimedAt?: Date | string | null
  claimedBy?: string | null
}

export type YoutubeWorkerStore = {
  aiJob: {
    findFirst: (args: {
      where: Record<string, unknown>
      orderBy?: Record<string, string>
    }) => Promise<YoutubeWorkerJob | null>
    updateMany: (args: {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }) => Promise<{ count: number }>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<YoutubeWorkerJob>
  }
  operationalEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>
    findFirst?: (args: {
      where: Record<string, unknown>
      orderBy?: Record<string, string>
    }) => Promise<{
      type: string
      payload: unknown
      createdAt?: Date | string
    } | null>
  }
  youTubePost?: {
    findUnique: (args: {
      where: { id: string }
    }) => Promise<Record<string, unknown> | null>
    update?: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<Record<string, unknown>>
  }
}

export type YoutubeWorkerHealth = {
  ok: true
  ready: boolean
  runtime: {
    platform: string
    arch: string
    node: string
    hostname: string
    cwd: string
    isVercel: boolean
  }
  mediaStorage: {
    root: string
    writable: boolean
  }
  vercelHeavyRoutesDisabled: true
  capabilities: string[]
  blockers: string[]
}

export function detectYoutubeWorkerRuntime(
  cwd: string = process.cwd(),
): YoutubeWorkerHealth["runtime"] {
  return {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    hostname:
      process.env.COMPUTERNAME ||
      process.env.HOSTNAME ||
      process.env.HOST ||
      "unknown",
    cwd,
    isVercel: Boolean(process.env.VERCEL),
  }
}

export function mediaStorageRoot(cwd: string = process.cwd()): string {
  return path.join(cwd, "public", "youtube-worker-media")
}

export function ensureMediaStorage(cwd: string = process.cwd()): {
  root: string
  writable: boolean
} {
  const root = mediaStorageRoot(cwd)
  try {
    fs.mkdirSync(root, { recursive: true })
    const probe = path.join(root, `.write-probe-${randomUUID()}`)
    fs.writeFileSync(probe, "ok")
    fs.unlinkSync(probe)
    return { root, writable: true }
  } catch {
    return { root, writable: false }
  }
}

export function isYoutubeWorkerLiveUploadAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.YOUTUBE_WORKER_ALLOW_LIVE === "1"
}

export function isYoutubeWorkerProductionGuardActive(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // Refuse live/prod job processing unless explicitly armed.
  // Verification-only and health checks remain available.
  return env.YOUTUBE_WORKER_ALLOW_PROD_JOBS !== "1"
}

export function reportYoutubeWorkerHealth(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): YoutubeWorkerHealth {
  const runtime = detectYoutubeWorkerRuntime(cwd)
  const storage = ensureMediaStorage(cwd)
  const blockers: string[] = []
  if (runtime.isVercel) {
    blockers.push("Worker must not run on Vercel serverless.")
  }
  if (!storage.writable) {
    blockers.push("Local media storage is not writable.")
  }
  const liveArmed = isYoutubeWorkerLiveUploadAllowed(env)
  const prodGuard = isYoutubeWorkerProductionGuardActive(env)
  return {
    ok: true,
    ready: blockers.length === 0,
    runtime,
    mediaStorage: storage,
    vercelHeavyRoutesDisabled: true,
    capabilities: [
      "governed-media-preparation",
      "durable-local-media-storage",
      "exact-asset-binding",
      "scheduled-authorised-uploads",
      "restart-recovery",
      "job-claiming",
      "duplicate-execution-protection",
      "provider-outcome-recording",
      "health-readiness",
      liveArmed ? "live-upload-armed" : "verify-only-default",
      prodGuard ? "production-jobs-blocked" : "production-jobs-allowed",
    ],
    blockers,
  }
}

export async function claimNextYoutubeWorkerJob(input: {
  store: YoutubeWorkerStore
  workerId: string
  now?: Date
}): Promise<YoutubeWorkerJob | null> {
  const now = input.now ?? new Date()
  const candidate = await input.store.aiJob.findFirst({
    where: {
      status: "queued",
      type: { in: [...YOUTUBE_WORKER_JOB_TYPES] },
      scheduledAt: { lte: now },
    },
    orderBy: { createdAt: "asc" },
  })
  if (!candidate) return null

  const claimed = await input.store.aiJob.updateMany({
    where: {
      id: candidate.id,
      status: "queued",
    },
    data: {
      status: "running",
      claimedAt: now,
      claimedBy: input.workerId,
      updatedAt: now,
    },
  })

  if (claimed.count !== 1) {
    // Lost race — another worker claimed it.
    return null
  }

  return {
    ...candidate,
    status: "running",
    claimedAt: now,
    claimedBy: input.workerId,
  }
}

export type PrepareDemoResult = {
  ok: true
  articleId: string
  youtubePostId: string
  packageFingerprint: string
  binding: YouTubeAssetBindingPayload
  assets: {
    longFormPath: string
    longFormSha256: string
    shortsPath: string
    shortsSha256: string
    thumbnailPath: string
    thumbnailSha256: string
    voiceoverPath: string
    voiceoverSha256: string
  }
  note: string
}

/**
 * Representative end-to-end preparation using zero-cost local fixtures.
 * Produces reviewable long-form + vertical Short + thumbnail + binding.
 * Explicitly not claimed as cinematic production proof.
 */
export async function prepareRepresentativeFixturePackage(input: {
  articleId?: string
  youtubePostId?: string
  actor?: string
  cwd?: string
}): Promise<PrepareDemoResult> {
  const cwd = input.cwd ?? process.cwd()
  const storage = ensureMediaStorage(cwd)
  const fixtures = createMinimalAvFixtures(cwd)
  const articleId = input.articleId ?? "r4a-demo-article"
  const youtubePostId = input.youtubePostId ?? `yt-demo-${randomUUID().slice(0, 8)}`
  const destDir = path.join(storage.root, youtubePostId)
  fs.mkdirSync(destDir, { recursive: true })

  const longFormPath = path.join(destDir, "long-form.mp4")
  const shortsPath = path.join(destDir, "short-vertical.mp4")
  const thumbnailPath = path.join(destDir, "thumbnail.jpg")
  const voiceoverPath = path.join(destDir, "voiceover.mp3")

  fs.copyFileSync(fixtures.videoPath, longFormPath)
  fs.copyFileSync(fixtures.verticalPath, shortsPath)
  fs.copyFileSync(fixtures.audioPath, voiceoverPath)
  if (fs.existsSync(fixtures.thumbPath)) {
    fs.copyFileSync(fixtures.thumbPath, thumbnailPath)
  } else {
    await createFixtureThumbnail(thumbnailPath, "R4-A fixture")
  }

  // Ensure vertical Short is actually 1080x1920 even if fixture reuse skipped re-encode.
  if (!fs.existsSync(shortsPath)) {
    runFfmpeg(
      [
        "-y",
        "-i",
        longFormPath,
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        shortsPath,
      ],
      cwd,
    )
  }

  const longFormSha256 = sha256File(longFormPath)
  const shortsSha256 = sha256File(shortsPath)
  const thumbnailSha256 = sha256File(thumbnailPath)
  const voiceoverSha256 = sha256File(voiceoverPath)

  const packageFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        articleId,
        youtubePostId,
        longFormSha256,
        shortsSha256,
        thumbnailSha256,
      }),
    )
    .digest("hex")

  const binding = buildYouTubeAssetBinding({
    articleId,
    youtubePostId,
    packageFingerprint,
    contentFingerprint: packageFingerprint,
    longForm: {
      videoPath: longFormPath,
      videoSha256: longFormSha256,
      thumbnailPath,
      thumbnailSha256,
      title: "R4-A fixture long-form (not cinematic proof)",
      description: "Zero-cost local fixture for governed multimedia readiness.",
    },
    shorts: {
      videoPath: shortsPath,
      videoSha256: shortsSha256,
      caption: "R4-A fixture Short (vertical 1080x1920)",
    },
    voiceoverPath,
    voiceoverSha256,
    boundBy: input.actor ?? "youtube-media-worker",
  })

  // Prove binding verification path.
  const match = verifyBoundYouTubeAssets(binding)
  if (!match.ok) {
    throw new Error(`Fixture binding verification failed: ${match.mismatch}`)
  }

  return {
    ok: true,
    articleId,
    youtubePostId,
    packageFingerprint,
    binding,
    assets: {
      longFormPath,
      longFormSha256,
      shortsPath,
      shortsSha256,
      thumbnailPath,
      thumbnailSha256,
      voiceoverPath,
      voiceoverSha256,
    },
    note:
      "Representative fixture preparation only — not cinematic production proof. Full production still uses existing render-video / generate-shorts local pipelines.",
  }
}

export type MockUploadResult =
  | {
      ok: true
      skipped?: boolean
      videoId?: string
      kind: "long-form" | "shorts"
      outcome: ChannelExecutionOutcome
    }
  | {
      ok: false
      code: string
      reason: string
      outcome?: ChannelExecutionOutcome
    }

export async function executeAuthorisedYoutubeUpload(input: {
  kind: "long-form" | "shorts"
  articleId: string
  youtubePostId: string
  binding: YouTubeAssetBindingPayload
  post: {
    youtubeVideoId?: string | null
    youtubeUrl?: string | null
    uploadStatus?: string | null
    shortsVideoId?: string | null
    shortsUploadUrl?: string | null
    shortsStatus?: string | null
    title?: string | null
    description?: string | null
  }
  store: YoutubeWorkerStore
  workerId: string
  /** Injected mock uploader — never live in R4-A validation. */
  uploadFn?: (req: {
    videoPath: string
    title: string
    description: string
    kind: "long-form" | "shorts"
  }) => Promise<{ videoId?: string | null; timedOut?: boolean }>
  openClaim?: ChannelExecutionClaim | null
  priorOutcome?: ChannelExecutionOutcome | null
  dryRun?: boolean
}): Promise<MockUploadResult> {
  const claimId = buildChannelClaimId({
    channel: input.kind === "long-form" ? "youtube" : "youtube-shorts",
    articleId: input.articleId,
    payloadId: input.youtubePostId,
  })

  const existingExternalId =
    input.kind === "long-form"
      ? input.post.youtubeVideoId
      : input.post.shortsVideoId

  const block = shouldBlockRetry({
    existingExternalId,
    openClaim: input.openClaim,
    priorOutcome: input.priorOutcome,
  })
  if (block.block && block.code === "already_published") {
    const outcome: ChannelExecutionOutcome = {
      v: 1,
      channel: input.kind === "long-form" ? "youtube" : "youtube-shorts",
      articleId: input.articleId,
      payloadId: input.youtubePostId,
      claimId,
      status: "skipped_already_published",
      externalId: existingExternalId,
      recordedAt: new Date().toISOString(),
      detail: block.reason,
    }
    await input.store.operationalEvent.create({
      data: {
        type: "youtube_upload_skipped",
        source: "youtube-media-worker",
        title: `YouTube ${input.kind} already uploaded`,
        message: block.reason,
        severity: "info",
        status: "new",
        entityType: "YouTubePost",
        entityId: input.youtubePostId,
        payload: outcome,
      },
    })
    return {
      ok: true,
      skipped: true,
      videoId: existingExternalId || undefined,
      kind: input.kind,
      outcome,
    }
  }
  if (block.block) {
    return {
      ok: false,
      code: block.code || "claim_blocked",
      reason: block.reason || "Blocked",
    }
  }

  const dup =
    input.kind === "long-form"
      ? guardLongFormReupload(input.post)
      : guardShortsReupload(input.post)
  if (dup.duplicate) {
    const outcome: ChannelExecutionOutcome = {
      v: 1,
      channel: input.kind === "long-form" ? "youtube" : "youtube-shorts",
      articleId: input.articleId,
      payloadId: input.youtubePostId,
      claimId,
      status: "skipped_already_published",
      externalId: dup.existingId,
      recordedAt: new Date().toISOString(),
      detail: dup.reason,
    }
    await input.store.operationalEvent.create({
      data: {
        type: "youtube_upload_skipped",
        source: "youtube-media-worker",
        title: `YouTube ${input.kind} already uploaded`,
        message: dup.reason,
        severity: "info",
        status: "new",
        entityType: "YouTubePost",
        entityId: input.youtubePostId,
        payload: outcome,
      },
    })
    return { ok: true, skipped: true, videoId: dup.existingId, kind: input.kind, outcome }
  }

  const videoPath =
    input.kind === "long-form"
      ? input.binding.longForm.videoPath
      : input.binding.shorts?.videoPath
  if (!videoPath || !fs.existsSync(videoPath)) {
    return {
      ok: false,
      code: "asset_missing",
      reason: "Approved video asset path missing on disk.",
    }
  }

  const match = verifyBoundYouTubeAssets(input.binding)
  if (!match.ok) {
    return {
      ok: false,
      code: "asset_mismatch",
      reason: match.mismatch || "Approved asset fingerprint mismatch.",
    }
  }

  const uploadReq =
    input.kind === "long-form"
      ? {
          title: input.binding.longForm.title,
          description: input.binding.longForm.description,
          videoPath,
        }
      : {
          title: `${input.binding.longForm.title} #Shorts`,
          description: input.binding.shorts?.caption || "",
          videoPath,
        }

  const liveAllowed = isYoutubeWorkerLiveUploadAllowed()
  if (input.dryRun || !input.uploadFn || !liveAllowed) {
    const outcome: ChannelExecutionOutcome = {
      v: 1,
      channel: input.kind === "long-form" ? "youtube" : "youtube-shorts",
      articleId: input.articleId,
      payloadId: input.youtubePostId,
      claimId,
      status: "provider_accepted",
      externalId: `dry-run-${input.kind}-${createHash("sha256").update(videoPath).digest("hex").slice(0, 10)}`,
      recordedAt: new Date().toISOString(),
      detail: liveAllowed
        ? "dry-run; no live upload"
        : "verify-only: YOUTUBE_WORKER_ALLOW_LIVE is not set; live upload blocked",
    }
    await input.store.operationalEvent.create({
      data: {
        type: "youtube_upload_dry_run",
        source: "youtube-media-worker",
        title: `YouTube ${input.kind} dry-run`,
        message: uploadReq.title,
        severity: "info",
        status: "new",
        entityType: "YouTubePost",
        entityId: input.youtubePostId,
        payload: { ...outcome, request: uploadReq },
      },
    })
    return {
      ok: true,
      videoId: outcome.externalId || undefined,
      kind: input.kind,
      outcome,
    }
  }

  let submitted = false
  try {
    submitted = true
    const result = await input.uploadFn({
      videoPath,
      title: uploadReq.title,
      description: uploadReq.description || "",
      kind: input.kind,
    })
    const status = classifyProviderTimeoutAsAmbiguous({
      submittedToProvider: true,
      providerId: result.videoId,
      timedOut: result.timedOut,
    })
    const outcome: ChannelExecutionOutcome = {
      v: 1,
      channel: input.kind === "long-form" ? "youtube" : "youtube-shorts",
      articleId: input.articleId,
      payloadId: input.youtubePostId,
      claimId,
      status,
      externalId: result.videoId ?? null,
      recordedAt: new Date().toISOString(),
      detail: result.timedOut
        ? "Provider timeout after submission — reconcile before retry"
        : undefined,
    }
    await input.store.operationalEvent.create({
      data: {
        type:
          status === "provider_accepted"
            ? "youtube_upload"
            : status === "ambiguous"
              ? "youtube_upload_ambiguous"
              : "youtube_upload_failed",
        source: "youtube-media-worker",
        title: `YouTube ${input.kind} ${status}`,
        message: outcome.detail || outcome.externalId || status,
        severity: status === "provider_accepted" ? "info" : "high",
        status: "new",
        entityType: "YouTubePost",
        entityId: input.youtubePostId,
        payload: outcome,
      },
    })
    if (status !== "provider_accepted") {
      return {
        ok: false,
        code: status === "ambiguous" ? "ambiguous_unresolved" : "provider_rejected",
        reason: outcome.detail || "Upload did not produce a definitive provider id.",
        outcome,
      }
    }
    return {
      ok: true,
      videoId: result.videoId || undefined,
      kind: input.kind,
      outcome,
    }
  } catch (error) {
    const status = classifyProviderTimeoutAsAmbiguous({
      submittedToProvider: submitted,
      providerId: null,
      timedOut: true,
    })
    const outcome: ChannelExecutionOutcome = {
      v: 1,
      channel: input.kind === "long-form" ? "youtube" : "youtube-shorts",
      articleId: input.articleId,
      payloadId: input.youtubePostId,
      claimId,
      status,
      externalId: null,
      recordedAt: new Date().toISOString(),
      detail: error instanceof Error ? error.message : "upload error",
    }
    await input.store.operationalEvent.create({
      data: {
        type: "youtube_upload_ambiguous",
        source: "youtube-media-worker",
        title: `YouTube ${input.kind} ambiguous`,
        message: outcome.detail,
        severity: "high",
        status: "new",
        entityType: "YouTubePost",
        entityId: input.youtubePostId,
        payload: outcome,
      },
    })
    return {
      ok: false,
      code: "ambiguous_unresolved",
      reason: outcome.detail || "Ambiguous provider outcome",
      outcome,
    }
  }
}

export async function runYoutubeWorkerOnce(input: {
  store: YoutubeWorkerStore
  workerId?: string
  cwd?: string
  now?: Date
}): Promise<{
  health: YoutubeWorkerHealth
  job: YoutubeWorkerJob | null
  result?: unknown
}> {
  const workerId = input.workerId ?? `yt-worker-${randomUUID().slice(0, 8)}`
  const cwd = input.cwd ?? process.cwd()
  const health = reportYoutubeWorkerHealth(cwd)
  if (!health.ready) {
    return { health, job: null, result: { blocked: health.blockers } }
  }

  if (isYoutubeWorkerProductionGuardActive()) {
    // Installation / connection verification must not claim Production AiJobs.
    return {
      health,
      job: null,
      result: {
        blocked: [
          "Production job claiming blocked until YOUTUBE_WORKER_ALLOW_PROD_JOBS=1",
        ],
        mode: "verify-only",
      },
    }
  }

  const job = await claimNextYoutubeWorkerJob({
    store: input.store,
    workerId,
    now: input.now,
  })
  if (!job) {
    return { health, job: null }
  }

  try {
    let result: unknown
    if (job.type === "youtube-health") {
      result = health
    } else if (job.type === "youtube-prepare") {
      const payload = (job.payload || {}) as {
        articleId?: string
        youtubePostId?: string
      }
      result = await prepareRepresentativeFixturePackage({
        articleId: payload.articleId,
        youtubePostId: payload.youtubePostId,
        actor: workerId,
        cwd,
      })
    } else {
      result = {
        ok: false,
        code: "handler_requires_binding",
        reason:
          "Upload jobs require an injected binding + mock/live uploader via executeAuthorisedYoutubeUpload.",
      }
    }

    await input.store.aiJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: result as object,
      },
    })
    return { health, job, result }
  } catch (error) {
    await input.store.aiJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : "worker error",
      },
    })
    throw error
  }
}

/** Convenience: ensure fixture dir exists for smoke demos. */
export function ensureWorkerFixtures(cwd: string = process.cwd()) {
  ensureR1FixtureDir(cwd)
  return createMinimalAvFixtures(cwd)
}
