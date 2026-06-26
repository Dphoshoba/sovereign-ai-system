import type { ContentAsset, ContentAssetType, ContentCampaign } from "./content-campaign"

export type ChannelPlanStep = {
  order: number
  assetType: ContentAssetType
  assetId: string
  dependencies: string[]
  estimatedEffort: "small" | "medium" | "large"
  reviewGate: "brief-review" | "editorial-review" | "channel-review" | "approval-review"
  action: string
  generationAllowed: false
  publicationAllowed: false
}

export type ChannelExecutionPlan = {
  campaignId: string
  recommendedCreationOrder: ChannelPlanStep[]
  missingAssets: ContentAssetType[]
  reviewGates: string[]
  generationAllowed: false
  publicationAllowed: false
  socialPostingAllowed: false
}

const CREATION_ORDER: ContentAssetType[] = [
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

export function buildChannelExecutionPlan(
  campaign: ContentCampaign
): ChannelExecutionPlan {
  const missingAssets = CREATION_ORDER.filter(
    (type) => !campaign.assets.some((asset) => asset.type === type)
  )
  const recommendedCreationOrder = CREATION_ORDER.map((type, index) => {
    const asset = campaign.assets.find((candidate) => candidate.type === type)

    return buildStep(index + 1, type, asset, campaign.id)
  })

  return {
    campaignId: campaign.id,
    recommendedCreationOrder,
    missingAssets,
    reviewGates: [
      "Master brief review",
      "Citation and claim review",
      "Channel fit review",
      "Human approval before any publication",
    ],
    generationAllowed: false,
    publicationAllowed: false,
    socialPostingAllowed: false,
  }
}

function buildStep(
  order: number,
  assetType: ContentAssetType,
  asset: ContentAsset | undefined,
  campaignId: string
): ChannelPlanStep {
  const isBrief = assetType === "master-brief"

  return {
    order,
    assetType,
    assetId: asset?.id ?? `${campaignId}:${assetType}:missing`,
    dependencies: isBrief ? [] : [`${campaignId}:master-brief`],
    estimatedEffort: effortForAsset(assetType),
    reviewGate: isBrief
      ? "brief-review"
      : assetType.includes("script") || assetType.includes("outline")
        ? "channel-review"
        : assetType === "lead-magnet" || assetType === "email-campaign"
          ? "approval-review"
          : "editorial-review",
    action: `Prepare ${assetType} from the approved master brief after review. No generation is executed in Phase 6.`,
    generationAllowed: false,
    publicationAllowed: false,
  }
}

function effortForAsset(assetType: ContentAssetType): "small" | "medium" | "large" {
  switch (assetType) {
    case "long-form-article":
    case "youtube-script":
    case "lead-magnet":
    case "email-campaign":
      return "large"
    case "newsletter":
    case "podcast-outline":
    case "presentation-outline":
    case "shorts-script":
      return "medium"
    default:
      return "small"
  }
}
