import type { ContentAssetType, ContentCampaign } from "./content-campaign"
import { validateContentLineage } from "./content-lineage"

export type ContentReadinessArea =
  | "Article"
  | "Newsletter"
  | "Social"
  | "Video"
  | "Podcast"
  | "Lead Magnet"
  | "Email"
  | "Campaign"

export type ContentReadinessStatus = "READY" | "PARTIAL" | "BLOCKED"

export type ContentReadinessItem = {
  area: ContentReadinessArea
  status: ContentReadinessStatus
  score: number
  detail: string
}

export type ContentReadinessResult = {
  campaignId: string
  overallReadiness: number
  status: ContentReadinessStatus
  noPublishing: true
  noSocialPosting: true
  noAutomaticApproval: true
  noGraphWrites: true
  items: ContentReadinessItem[]
  blockers: string[]
}

export function evaluateContentReadiness(
  campaign: ContentCampaign
): ContentReadinessResult {
  const items: ContentReadinessItem[] = [
    readinessForGroup(campaign, "Article", ["long-form-article"]),
    readinessForGroup(campaign, "Newsletter", ["newsletter"]),
    readinessForGroup(campaign, "Social", ["linkedin", "x-twitter", "threads", "facebook"]),
    readinessForGroup(campaign, "Video", ["youtube-script", "shorts-script"]),
    readinessForGroup(campaign, "Podcast", ["podcast-outline"]),
    readinessForGroup(campaign, "Lead Magnet", ["lead-magnet"]),
    readinessForGroup(campaign, "Email", ["email-campaign"]),
    readinessForCampaign(campaign),
  ]
  const blockers = items
    .filter((item) => item.status === "BLOCKED")
    .map((item) => `${item.area}: ${item.detail}`)
  const overallReadiness = Math.round(
    items.reduce((sum, item) => sum + item.score, 0) / items.length
  )

  return {
    campaignId: campaign.id,
    overallReadiness,
    status:
      blockers.length > 0
        ? "BLOCKED"
        : items.some((item) => item.status === "PARTIAL")
          ? "PARTIAL"
          : "READY",
    noPublishing: true,
    noSocialPosting: true,
    noAutomaticApproval: true,
    noGraphWrites: true,
    items,
    blockers,
  }
}

export function buildContentDashboard(campaign: ContentCampaign) {
  const readiness = evaluateContentReadiness(campaign)
  const missingAssets = campaign.assets.filter(
    (asset) => asset.publicationState === "not-generated"
  )
  const pendingReview = campaign.assets.filter(
    (asset) => asset.reviewStatus !== "reviewed"
  )
  const pendingApproval = campaign.assets.filter(
    (asset) => asset.approvalStatus !== "approved"
  )

  return {
    campaignId: campaign.id,
    topic: campaign.topic,
    assetCounts: {
      total: campaign.assets.length,
      missing: missingAssets.length,
      pendingReview: pendingReview.length,
      pendingApproval: pendingApproval.length,
      readyForGeneration: campaign.assets.filter(
        (asset) => asset.publicationState === "ready-for-generation"
      ).length,
      readyForPublication: 0,
    },
    readiness,
    noPublishing: true,
    noSocialPosting: true,
    noAutomaticApproval: true,
    noGraphWrites: true,
  }
}

function readinessForGroup(
  campaign: ContentCampaign,
  area: ContentReadinessArea,
  assetTypes: ContentAssetType[]
): ContentReadinessItem {
  const assets = campaign.assets.filter((asset) => assetTypes.includes(asset.type))

  if (assets.length === 0) {
    return {
      area,
      status: "BLOCKED",
      score: 0,
      detail: "Required assets are missing.",
    }
  }

  const lineageValid = assets.every((asset) => validateContentLineage(asset.lineage).valid)
  const averageReadiness = Math.round(
    assets.reduce((sum, asset) => sum + asset.readiness, 0) / assets.length
  )

  return {
    area,
    status: lineageValid ? "PARTIAL" : "BLOCKED",
    score: lineageValid ? averageReadiness : Math.min(averageReadiness, 45),
    detail: lineageValid
      ? "Assets are planned and traceable, but generation/publication remains blocked pending human review."
      : "One or more assets lack required lineage.",
  }
}

function readinessForCampaign(campaign: ContentCampaign): ContentReadinessItem {
  const lineageValid = campaign.assets.every((asset) =>
    validateContentLineage(asset.lineage).valid
  )
  const hasBrief = campaign.assets.some((asset) => asset.type === "master-brief")

  return {
    area: "Campaign",
    status: lineageValid && hasBrief ? "PARTIAL" : "BLOCKED",
    score: lineageValid && hasBrief ? 72 : 40,
    detail:
      lineageValid && hasBrief
        ? "Campaign is orchestrated and traceable; generation and publication are still gated."
        : "Campaign needs complete lineage and master brief before generation readiness.",
  }
}
