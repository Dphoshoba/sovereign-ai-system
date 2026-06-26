import type { ContentCampaign } from "./content-campaign"
import type {
  DraftPreviewPacket,
  DraftPreviewValidationStatus,
} from "./draft-preview-packet"

export type CampaignPreviewDependency = {
  from: string
  to: string
  relationship: "depends-on" | "derives-from"
}

export type CampaignPreview = {
  campaignId: string
  missionId: string
  totalAssets: number
  readyAssets: number
  blockedAssets: number
  reviewRequiredAssets: number
  missingRequirements: string[]
  dependencyGraph: {
    nodes: Array<{
      id: string
      type: "mission" | "master-brief" | "asset"
      label: string
    }>
    edges: CampaignPreviewDependency[]
  }
  reviewQueueSummary: {
    required: number
    reasons: string[]
  }
  approvalSummary: {
    required: number
    automaticApprovals: false
    reasons: string[]
  }
  readiness: {
    status: DraftPreviewValidationStatus
    score: number
  }
  generatedContent: false
  writesToPrisma: false
  publishingExecuted: false
  socialPostingExecuted: false
  automaticApprovals: false
}

export function buildCampaignPreview(input: {
  campaign: ContentCampaign
  packets: DraftPreviewPacket[]
}): CampaignPreview {
  const readyAssets = input.packets.filter(
    (packet) => packet.readinessStatus === "READY_FOR_GENERATION"
  ).length
  const blockedAssets = input.packets.filter(
    (packet) => packet.readinessStatus === "BLOCKED"
  ).length
  const reviewRequiredAssets = input.packets.filter(
    (packet) => packet.readinessStatus === "REVIEW_REQUIRED"
  ).length
  const missingRequirements = [
    ...new Set(input.packets.flatMap((packet) => packet.missingRequirements)),
  ]
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          blockedAssets * 15 -
          reviewRequiredAssets * 3 -
          missingRequirements.length * 4
      )
    )
  )
  const status: DraftPreviewValidationStatus =
    blockedAssets > 0
      ? "BLOCKED"
      : reviewRequiredAssets > 0
        ? "REVIEW_REQUIRED"
        : "READY_FOR_GENERATION"

  return {
    campaignId: input.campaign.id,
    missionId: input.campaign.parentMission,
    totalAssets: input.packets.length,
    readyAssets,
    blockedAssets,
    reviewRequiredAssets,
    missingRequirements,
    dependencyGraph: buildDependencyGraph(input.campaign, input.packets),
    reviewQueueSummary: {
      required: reviewRequiredAssets,
      reasons: [
        "Human editorial review remains required.",
        "Citation review remains required.",
        "Risk flags must be accepted or resolved before generation.",
      ],
    },
    approvalSummary: {
      required: input.packets.length,
      automaticApprovals: false,
      reasons: [
        "Approval is separate from draft preview readiness.",
        "Approval does not publish content.",
        "Approval cannot be automatic in Phase 6C.",
      ],
    },
    readiness: {
      status,
      score,
    },
    generatedContent: false,
    writesToPrisma: false,
    publishingExecuted: false,
    socialPostingExecuted: false,
    automaticApprovals: false,
  }
}

function buildDependencyGraph(
  campaign: ContentCampaign,
  packets: DraftPreviewPacket[]
) {
  const masterBriefNodeId = `${campaign.id}:master-brief`

  return {
    nodes: [
      {
        id: campaign.parentMission,
        type: "mission" as const,
        label: "Approved Research Mission",
      },
      {
        id: masterBriefNodeId,
        type: "master-brief" as const,
        label: "Master Brief",
      },
      ...packets.map((packet) => ({
        id: `${packet.campaignId}:${packet.assetType}`,
        type: "asset" as const,
        label: packet.assetType,
      })),
    ],
    edges: [
      {
        from: campaign.parentMission,
        to: masterBriefNodeId,
        relationship: "derives-from" as const,
      },
      ...packets.map((packet) => ({
        from: masterBriefNodeId,
        to: `${packet.campaignId}:${packet.assetType}`,
        relationship: "depends-on" as const,
      })),
    ],
  }
}
