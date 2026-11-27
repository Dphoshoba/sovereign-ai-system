/**
 * Coherent Director-facing readiness for the complete selected multimedia package.
 * Additive to the existing checklist — does not create a parallel approval workflow.
 */

import {
  channelAuthorised,
  latestDistributionScope,
  resolveAuthorisedChannels,
  type DistributionChannel,
  type ReviewNoteLike,
} from "./distribution-scope"
import { buildPublicationPackage, type YoutubePackageAssets } from "./publication-package"

export type ChannelReadinessRow = {
  channel: DistributionChannel | "website"
  authorised: boolean
  assetReady: boolean
  accountOrPage: string | null
  blocker: string | null
  outcome: string | null
}

export type MultimediaPackageReadiness = {
  complete: boolean
  missing: string[]
  packageFingerprint: string | null
  channels: DistributionChannel[]
  schedule: string | null
  approvalState: "unbound" | "bound" | "stale" | "ordinary-work-legacy"
  rows: ChannelReadinessRow[]
  youtubePreview: {
    longFormReady: boolean
    shortsReady: boolean
    title: string | null
    description: string | null
  } | null
  socialCopy: {
    x: string | null
    linkedin: string | null
    threads: string | null
    facebook: string | null
  }
}

export function buildMultimediaPackageReadiness(input: {
  article: {
    id: string
    title: string
    slug: string
    status: string
    excerpt: string | null
    content: string | null
    featuredImage: string | null
    seoTitle: string | null
    seoDescription: string | null
    seoKeywords: string | null
    scheduledFor: Date | string | null
    reviewNotes: ReviewNoteLike[]
  }
  contentFingerprint: string
  evidenceSummary: {
    auditId: string | null
    recommendation: string | null
    consensusScore: number | null
    sourceQualityScore: number | null
  }
  xAnnouncement: { id: string; content: string; status: string } | null
  linkedinAnnouncement: { id: string; content: string; status: string } | null
  threadsAnnouncement?: { id: string; content: string; status: string } | null
  facebookAnnouncement?: { id: string; content: string; status: string } | null
  newsletter: {
    id: string
    subject: string
    previewText: string | null
    content: string
    status: string
  } | null
  youtubeAssets?: YoutubePackageAssets | null
  connectionStatus?: {
    x?: string | null
    linkedin?: string | null
    threads?: string | null
    facebookPage?: string | null
    youtube?: string | null
  }
  outcomes?: Partial<Record<DistributionChannel, string | null>>
}): MultimediaPackageReadiness {
  const scope = latestDistributionScope(input.article.reviewNotes)
  const requested = scope?.channels ?? []
  const authorised = resolveAuthorisedChannels({
    articleId: input.article.id,
    reviewNotes: input.article.reviewNotes,
  })

  const pkg = buildPublicationPackage({
    article: input.article,
    contentFingerprint: input.contentFingerprint,
    evidenceSummary: input.evidenceSummary,
    xAnnouncement: input.xAnnouncement,
    linkedinAnnouncement: input.linkedinAnnouncement,
    threadsAnnouncement: input.threadsAnnouncement,
    facebookAnnouncement: input.facebookAnnouncement,
    newsletter: input.newsletter,
    youtubeAssets: input.youtubeAssets,
    requestedChannels: requested.length > 0 ? requested : ["x"],
  })

  const rows: ChannelReadinessRow[] = [
    {
      channel: "website",
      authorised: true,
      assetReady: Boolean(input.article.content?.trim()),
      accountOrPage: "echoesandvisions.com",
      blocker: input.article.content?.trim() ? null : "Article content missing",
      outcome:
        input.article.status === "published" ? "published" : input.article.status,
    },
  ]

  const channelAsset = (channel: DistributionChannel): boolean => {
    switch (channel) {
      case "x":
        return Boolean(input.xAnnouncement?.content)
      case "linkedin":
        return Boolean(input.linkedinAnnouncement?.content)
      case "threads":
        return Boolean(input.threadsAnnouncement?.content)
      case "facebook":
        return Boolean(input.facebookAnnouncement?.content)
      case "newsletter":
        return Boolean(
          input.newsletter?.subject &&
            input.newsletter.content &&
            input.newsletter.previewText != null,
        )
      case "youtube":
        return Boolean(input.youtubeAssets?.longFormReady)
      case "youtube-shorts":
        return Boolean(input.youtubeAssets?.shortsReady)
      default:
        return false
    }
  }

  const accountFor = (channel: DistributionChannel): string | null => {
    switch (channel) {
      case "x":
        return input.connectionStatus?.x ?? null
      case "linkedin":
        return input.connectionStatus?.linkedin ?? null
      case "threads":
        return input.connectionStatus?.threads ?? null
      case "facebook":
        return input.connectionStatus?.facebookPage ?? null
      case "youtube":
      case "youtube-shorts":
        return input.connectionStatus?.youtube ?? null
      case "newsletter":
        return "resend"
      default:
        return null
    }
  }

  for (const channel of requested) {
    const auth = channelAuthorised(authorised.scope, channel)
    const ready = channelAsset(channel)
    let blocker: string | null = null
    if (!auth) blocker = "Channel not authorised / scope stale"
    else if (!ready) blocker = "Prepared asset missing for I2 approval"
    else if (
      (channel === "facebook" && !input.connectionStatus?.facebookPage) ||
      (channel === "threads" && !input.connectionStatus?.threads) ||
      ((channel === "youtube" || channel === "youtube-shorts") &&
        !input.connectionStatus?.youtube)
    ) {
      blocker = "Connection / account not ready (activation required)"
    }

    rows.push({
      channel,
      authorised: auth,
      assetReady: ready,
      accountOrPage: accountFor(channel),
      blocker,
      outcome: input.outcomes?.[channel] ?? null,
    })
  }

  return {
    complete: pkg.complete && !authorised.stale,
    missing: authorised.stale ? [...pkg.missing, "stale_scope"] : pkg.missing,
    packageFingerprint: scope?.packageFingerprint ?? pkg.packageFingerprint,
    channels: authorised.channels,
    schedule: pkg.schedule,
    approvalState: authorised.stale
      ? "stale"
      : authorised.source === "ordinary-work-legacy"
        ? "ordinary-work-legacy"
        : authorised.source === "bound"
          ? "bound"
          : "unbound",
    rows,
    youtubePreview: input.youtubeAssets
      ? {
          longFormReady: input.youtubeAssets.longFormReady,
          shortsReady: input.youtubeAssets.shortsReady,
          title: input.youtubeAssets.title,
          description: input.youtubeAssets.description,
        }
      : null,
    socialCopy: {
      x: input.xAnnouncement?.content ?? null,
      linkedin: input.linkedinAnnouncement?.content ?? null,
      threads: input.threadsAnnouncement?.content ?? null,
      facebook: input.facebookAnnouncement?.content ?? null,
    },
  }
}
