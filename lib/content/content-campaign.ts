export type ContentAssetType =
  | "master-brief"
  | "long-form-article"
  | "newsletter"
  | "linkedin"
  | "x-twitter"
  | "threads"
  | "facebook"
  | "youtube-script"
  | "shorts-script"
  | "podcast-outline"
  | "presentation-outline"
  | "lead-magnet"
  | "email-campaign"

export type ContentReviewStatus =
  | "not-started"
  | "needs-review"
  | "in-review"
  | "reviewed"

export type ContentApprovalStatus =
  | "not-requested"
  | "pending"
  | "approved"
  | "rejected"

export type ContentPublicationState =
  | "not-generated"
  | "draft-only"
  | "ready-for-generation"
  | "ready-for-publication-review"
  | "published"
  | "blocked"

export type ContentLineage = {
  researchMissionId: string
  evidenceIds: string[]
  consensusIds: string[]
  ontologyRecordIds: string[]
  reviewPackageIds: string[]
  masterBriefId: string | null
  parentAssetIds: string[]
}

export type ContentCitation = {
  id: string
  label: string
  sourceTitle: string
  sourceUrl: string
  evidenceId: string
}

export type ContentAsset = {
  id: string
  type: ContentAssetType
  parentMission: string
  campaignId: string
  lineage: ContentLineage
  reviewStatus: ContentReviewStatus
  approvalStatus: ContentApprovalStatus
  readiness: number
  publicationState: ContentPublicationState
  citations: ContentCitation[]
  version: number
}

export type ApprovedResearchMissionInput = {
  id: string
  topic: string
  category: string
  audience: string
  purpose: string
  keyFindings: string[]
  verifiedClaims: string[]
  citations: ContentCitation[]
  evidenceIds: string[]
  consensusIds: string[]
  ontologyRecordIds: string[]
  reviewPackageIds: string[]
  approvalStatus: "approved"
  risks: string[]
}

export type ContentCampaign = {
  id: string
  parentMission: string
  topic: string
  category: string
  reviewStatus: ContentReviewStatus
  approvalStatus: ContentApprovalStatus
  publicationState: ContentPublicationState
  assets: ContentAsset[]
  governance: {
    noPublishing: true
    noSocialPosting: true
    noAutomaticApproval: true
    noGraphWrites: true
    reviewRequired: true
  }
}

export const CAMPAIGN_ASSET_TYPES: ContentAssetType[] = [
  "master-brief",
  "long-form-article",
  "newsletter",
  "linkedin",
  "x-twitter",
  "threads",
  "facebook",
  "youtube-script",
  "shorts-script",
  "podcast-outline",
  "presentation-outline",
  "lead-magnet",
  "email-campaign",
]

export function buildContentCampaign(
  mission: ApprovedResearchMissionInput
): ContentCampaign {
  const campaignId = `content-campaign:${slugify(mission.topic)}`
  const masterBriefId = `${campaignId}:master-brief`
  const assets = CAMPAIGN_ASSET_TYPES.map((type) =>
    buildCampaignAsset(type, mission, campaignId, masterBriefId)
  )

  return {
    id: campaignId,
    parentMission: mission.id,
    topic: mission.topic,
    category: mission.category,
    reviewStatus: "needs-review",
    approvalStatus: "not-requested",
    publicationState: "draft-only",
    assets,
    governance: {
      noPublishing: true,
      noSocialPosting: true,
      noAutomaticApproval: true,
      noGraphWrites: true,
      reviewRequired: true,
    },
  }
}

export function summarizeCampaign(campaign: ContentCampaign) {
  const missingAssets = CAMPAIGN_ASSET_TYPES.filter(
    (type) => !campaign.assets.some((asset) => asset.type === type)
  )
  const pendingReview = campaign.assets.filter(
    (asset) => asset.reviewStatus !== "reviewed"
  )
  const pendingApproval = campaign.assets.filter(
    (asset) => asset.approvalStatus !== "approved"
  )

  return {
    id: campaign.id,
    parentMission: campaign.parentMission,
    topic: campaign.topic,
    assetCount: campaign.assets.length,
    missingAssets,
    pendingReview: pendingReview.length,
    pendingApproval: pendingApproval.length,
    readyForGeneration: campaign.assets.filter(
      (asset) => asset.publicationState === "ready-for-generation"
    ).length,
    readyForPublication: 0,
    noPublishing: true,
    noAutomaticApproval: true,
    noGraphWrites: true,
  }
}

function buildCampaignAsset(
  type: ContentAssetType,
  mission: ApprovedResearchMissionInput,
  campaignId: string,
  masterBriefId: string
): ContentAsset {
  const isBrief = type === "master-brief"

  return {
    id: `${campaignId}:${type}`,
    type,
    parentMission: mission.id,
    campaignId,
    lineage: {
      researchMissionId: mission.id,
      evidenceIds: mission.evidenceIds,
      consensusIds: mission.consensusIds,
      ontologyRecordIds: mission.ontologyRecordIds,
      reviewPackageIds: mission.reviewPackageIds,
      masterBriefId: isBrief ? null : masterBriefId,
      parentAssetIds: isBrief ? [] : [masterBriefId],
    },
    reviewStatus: "needs-review",
    approvalStatus: "not-requested",
    readiness: isBrief ? 86 : 58,
    publicationState: isBrief ? "draft-only" : "ready-for-generation",
    citations: mission.citations,
    version: 1,
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
