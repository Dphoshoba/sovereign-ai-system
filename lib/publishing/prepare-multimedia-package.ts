/**
 * Unified autonomous multimedia package preparation entrypoint (pre-I2).
 *
 * Composes existing generators — does not create a parallel pipeline.
 * Produces / verifies reviewable assets for the selected channels before I2.
 * Fixture generation is never described as full cinematic production.
 */

import {
  sanitizeDistributionChannels,
  type DistributionChannel,
} from "./distribution-scope"
import {
  buildPublicationPackage,
  type CompletePublicationPackage,
  type PublicationPackageArticle,
  type SocialAnnouncement,
  type YoutubePackageAssets,
} from "./publication-package"
import { buildMultimediaPackageReadiness } from "./multimedia-package-readiness"

export const PREPARE_MULTIMEDIA_ACTION = "prepare-multimedia-package"

export type PrepareMultimediaInputs = {
  article: PublicationPackageArticle
  contentFingerprint: string
  evidenceSummary: {
    auditId: string | null
    recommendation: string | null
    consensusScore: number | null
    sourceQualityScore: number | null
  }
  requestedChannels: DistributionChannel[]
  xAnnouncement: SocialAnnouncement | null
  linkedinAnnouncement: SocialAnnouncement | null
  threadsAnnouncement: SocialAnnouncement | null
  facebookAnnouncement: SocialAnnouncement | null
  newsletter: {
    id: string
    subject: string
    previewText: string | null
    content: string
    status: string
  } | null
  youtubeAssets: YoutubePackageAssets | null
}

export type PrepareMultimediaDeps = {
  /** Existing social draft generator (e.g. /api/social/generate path). */
  ensureSocialDrafts?: (input: {
    articleId: string
    channels: DistributionChannel[]
  }) => Promise<{ created: string[]; skipped: string[] }>
  /** Existing newsletter draft generator (must not send). */
  ensureNewsletterDraft?: (input: {
    articleId: string
  }) => Promise<{ created: boolean; reason: string }>
  /**
   * Local YouTube preparation using existing render/generate pipelines.
   * Must produce reviewable files when video channels are selected.
   * Must not use paid generation solely for testing.
   */
  ensureYoutubeAssets?: (input: {
    articleId: string
    channels: DistributionChannel[]
  }) => Promise<YoutubePackageAssets | null>
  /** Optional review-note recorder. */
  recordNote?: (input: {
    articleId: string
    action: string
    note: string
    actor: string
  }) => Promise<void>
}

export type PrepareMultimediaResult = {
  ok: true
  articleId: string
  requestedChannels: DistributionChannel[]
  package: CompletePublicationPackage
  readiness: ReturnType<typeof buildMultimediaPackageReadiness>
  prepared: {
    social: string[]
    newsletter: boolean
    youtube: boolean
  }
  missingForI2: string[]
  note: string
}

/**
 * After I1 topic confirmation and article existence: prepare the complete
 * selected package for Director I2 review. Stops before distribution scope bind.
 */
export async function prepareMultimediaPackageForI2(input: {
  articleId: string
  actor: string
  requestedChannels: DistributionChannel[]
  snapshot: PrepareMultimediaInputs
  deps?: PrepareMultimediaDeps
}): Promise<PrepareMultimediaResult> {
  const channels = sanitizeDistributionChannels(input.requestedChannels)
  if (channels.length === 0) {
    throw new Error("At least one distribution channel is required for preparation.")
  }

  const prepared = {
    social: [] as string[],
    newsletter: false,
    youtube: false,
  }

  let snapshot = { ...input.snapshot, requestedChannels: channels }

  const socialNeeded = channels.filter((c) =>
    ["x", "linkedin", "threads", "facebook"].includes(c),
  )
  if (socialNeeded.length > 0 && input.deps?.ensureSocialDrafts) {
    const social = await input.deps.ensureSocialDrafts({
      articleId: input.articleId,
      channels: socialNeeded,
    })
    prepared.social = social.created
  }

  if (channels.includes("newsletter") && input.deps?.ensureNewsletterDraft) {
    const nl = await input.deps.ensureNewsletterDraft({
      articleId: input.articleId,
    })
    prepared.newsletter = nl.created
  }

  if (
    (channels.includes("youtube") || channels.includes("youtube-shorts")) &&
    input.deps?.ensureYoutubeAssets
  ) {
    const yt = await input.deps.ensureYoutubeAssets({
      articleId: input.articleId,
      channels,
    })
    if (yt) {
      snapshot = { ...snapshot, youtubeAssets: yt }
      prepared.youtube = yt.longFormReady || yt.shortsReady
    }
  }

  const pkg = buildPublicationPackage(snapshot)
  const readiness = buildMultimediaPackageReadiness({
    article: snapshot.article,
    contentFingerprint: snapshot.contentFingerprint,
    evidenceSummary: snapshot.evidenceSummary,
    xAnnouncement: snapshot.xAnnouncement,
    linkedinAnnouncement: snapshot.linkedinAnnouncement,
    threadsAnnouncement: snapshot.threadsAnnouncement,
    facebookAnnouncement: snapshot.facebookAnnouncement,
    newsletter: snapshot.newsletter,
    youtubeAssets: snapshot.youtubeAssets,
  })

  if (input.deps?.recordNote) {
    await input.deps.recordNote({
      articleId: input.articleId,
      action: PREPARE_MULTIMEDIA_ACTION,
      actor: input.actor,
      note: JSON.stringify({
        v: 1,
        channels,
        missing: pkg.missing,
        prepared,
        packageFingerprint: pkg.packageFingerprint,
        at: new Date().toISOString(),
      }),
    })
  }

  return {
    ok: true,
    articleId: input.articleId,
    requestedChannels: channels,
    package: pkg,
    readiness,
    prepared,
    missingForI2: pkg.missing,
    note: pkg.complete
      ? "Package complete for I2 review. Bind distribution scope only after Director approval of exact assets."
      : `Package incomplete for I2: missing ${pkg.missing.join(", ")}. Continue preparation using existing generators; do not treat fixtures as cinematic production.`,
  }
}
