import {
  CONTENT_TO_DRAFT_ASSET_TYPE,
  type DraftAssetType,
} from "./asset-prompt-contracts"
import { buildCampaignPreview, type CampaignPreview } from "./campaign-preview"
import { orchestrateContentCampaign } from "./content-orchestrator"
import {
  buildDraftGenerationContracts,
  type DraftGenerationContract,
} from "./draft-generation-contracts"
import {
  buildDraftPreviewPacket,
  type DraftPreviewPacket,
} from "./draft-preview-packet"

export type GovernedDraftPreviewResult = {
  previewOnly: true
  writesToPrisma: false
  generationExecuted: false
  generatedContent: false
  publishingExecuted: false
  socialPostingExecuted: false
  automaticApprovals: false
  openAiCalls: false
  campaignPreview: CampaignPreview
  packets: DraftPreviewPacket[]
  dashboard: {
    campaignOverview: {
      campaignId: string
      missionId: string
      topic: string
      totalAssets: number
    }
    assetDependencyGraph: CampaignPreview["dependencyGraph"]
    readinessSummary: CampaignPreview["readiness"]
    reviewBottlenecks: string[]
    approvalBottlenecks: string[]
  }
}

export function buildGovernedDraftPreview(): GovernedDraftPreviewResult {
  const orchestration = orchestrateContentCampaign()
  const contractSet = buildDraftGenerationContracts({
    campaign: orchestration.campaign,
    masterBrief: orchestration.masterBrief,
  })
  const contractsByAssetType = new Map<DraftAssetType, DraftGenerationContract>(
    contractSet.contracts.map((contract) => [contract.assetType, contract])
  )
  const packets = orchestration.campaign.assets
    .map((asset) => {
      const assetType = CONTENT_TO_DRAFT_ASSET_TYPE[asset.type]

      if (!assetType) return null

      const contract = contractsByAssetType.get(assetType)

      if (!contract) return null

      return buildDraftPreviewPacket({
        asset,
        campaign: orchestration.campaign,
        masterBrief: orchestration.masterBrief,
        contract,
      })
    })
    .filter((packet): packet is DraftPreviewPacket => Boolean(packet))
  const campaignPreview = buildCampaignPreview({
    campaign: orchestration.campaign,
    packets,
  })

  return {
    previewOnly: true,
    writesToPrisma: false,
    generationExecuted: false,
    generatedContent: false,
    publishingExecuted: false,
    socialPostingExecuted: false,
    automaticApprovals: false,
    openAiCalls: false,
    campaignPreview,
    packets,
    dashboard: {
      campaignOverview: {
        campaignId: orchestration.campaign.id,
        missionId: orchestration.campaign.parentMission,
        topic: orchestration.campaign.topic,
        totalAssets: packets.length,
      },
      assetDependencyGraph: campaignPreview.dependencyGraph,
      readinessSummary: campaignPreview.readiness,
      reviewBottlenecks: campaignPreview.reviewQueueSummary.reasons,
      approvalBottlenecks: campaignPreview.approvalSummary.reasons,
    },
  }
}

export function summarizeGovernedDraftPreview(
  result: GovernedDraftPreviewResult
) {
  return {
    campaignId: result.campaignPreview.campaignId,
    packets: result.packets.length,
    readinessStatus: result.campaignPreview.readiness.status,
    readinessScore: result.campaignPreview.readiness.score,
    blockedAssets: result.campaignPreview.blockedAssets,
    reviewRequiredAssets: result.campaignPreview.reviewRequiredAssets,
    generatedContent: false,
    writesToPrisma: false,
    publishingExecuted: false,
    socialPostingExecuted: false,
    automaticApprovals: false,
  }
}
