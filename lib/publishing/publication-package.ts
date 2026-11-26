import {
  computePackageFingerprint,
  type DistributionChannel,
  type DistributionScopePayload,
  resolveAuthorisedChannels,
  serializeDistributionScope,
  DISTRIBUTION_SCOPE_ACTION,
} from "./distribution-scope"

export type PublicationPackageArticle = {
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
  reviewNotes: Array<{
    action: string
    note: string | null
    createdAt?: Date | string
  }>
}

export type PublicationPackageInputs = {
  article: PublicationPackageArticle
  contentFingerprint: string
  evidenceSummary: {
    auditId: string | null
    recommendation: string | null
    consensusScore: number | null
    sourceQualityScore: number | null
  }
  xAnnouncement: { id: string; content: string; status: string } | null
  newsletter: {
    id: string
    subject: string
    previewText: string | null
    content: string
    status: string
  } | null
  requestedChannels: DistributionChannel[]
}

export type CompletePublicationPackage = {
  complete: boolean
  missing: string[]
  articleId: string
  contentFingerprint: string
  featuredImage: string | null
  seo: {
    title: string | null
    description: string | null
    keywords: string | null
  }
  evidence: PublicationPackageInputs["evidenceSummary"]
  x: PublicationPackageInputs["xAnnouncement"]
  newsletter: PublicationPackageInputs["newsletter"]
  channels: DistributionChannel[]
  schedule: string | null
  packageFingerprint: string
  authorised: ReturnType<typeof resolveAuthorisedChannels>
}

export function buildPublicationPackage(
  input: PublicationPackageInputs,
): CompletePublicationPackage {
  const missing: string[] = []
  if (!input.article.content?.trim()) missing.push("article")
  if (!input.contentFingerprint) missing.push("contentFingerprint")
  if (!input.evidenceSummary.auditId) missing.push("evidence")
  if (!input.article.featuredImage) missing.push("image")
  if (!input.article.seoTitle || !input.article.seoDescription) missing.push("seo")
  if (input.requestedChannels.includes("x") && !input.xAnnouncement?.content) {
    missing.push("x")
  }
  if (input.requestedChannels.includes("newsletter")) {
    if (
      !input.newsletter?.subject ||
      !input.newsletter?.content ||
      input.newsletter.previewText == null
    ) {
      missing.push("newsletter")
    }
  }
  if (input.requestedChannels.length === 0) missing.push("channels")
  const schedule =
    input.article.scheduledFor == null
      ? null
      : new Date(input.article.scheduledFor).toISOString()
  if (input.article.status === "scheduled" && !schedule) missing.push("schedule")

  const packageFingerprint = computePackageFingerprint({
    articleId: input.article.id,
    contentFingerprint: input.contentFingerprint,
    featuredImage: input.article.featuredImage,
    seoTitle: input.article.seoTitle,
    seoDescription: input.article.seoDescription,
    seoKeywords: input.article.seoKeywords,
    xContent: input.xAnnouncement?.content ?? null,
    newsletterSubject: input.newsletter?.subject ?? null,
    newsletterPreview: input.newsletter?.previewText ?? null,
    newsletterBody: input.newsletter?.content ?? null,
    channels: input.requestedChannels,
    scheduledFor: schedule,
  })

  const authorised = resolveAuthorisedChannels({
    articleId: input.article.id,
    reviewNotes: input.article.reviewNotes,
    currentPackageFingerprint: packageFingerprint,
  })

  return {
    complete: missing.length === 0,
    missing,
    articleId: input.article.id,
    contentFingerprint: input.contentFingerprint,
    featuredImage: input.article.featuredImage,
    seo: {
      title: input.article.seoTitle,
      description: input.article.seoDescription,
      keywords: input.article.seoKeywords,
    },
    evidence: input.evidenceSummary,
    x: input.xAnnouncement,
    newsletter: input.newsletter,
    channels: input.requestedChannels,
    schedule,
    packageFingerprint,
    authorised,
  }
}

export function bindDistributionScopeNote(input: {
  articleId: string
  channels: DistributionChannel[]
  packageFingerprint: string
  contentFingerprint: string
  actor: string
  note?: string
}): { action: string; note: string; payload: DistributionScopePayload } {
  const payload: DistributionScopePayload = {
    v: 1,
    channels: input.channels,
    packageFingerprint: input.packageFingerprint,
    articleId: input.articleId,
    contentFingerprint: input.contentFingerprint,
    boundAt: new Date().toISOString(),
    boundBy: input.actor,
    note: input.note,
  }
  return {
    action: DISTRIBUTION_SCOPE_ACTION,
    note: serializeDistributionScope(payload),
    payload,
  }
}
