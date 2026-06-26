import type { ContentCampaign } from "./content-campaign"
import type { MasterContentBrief } from "./content-brief"
import {
  DRAFT_ASSET_TYPES,
  buildAssetPromptContract,
  type DraftAssetType,
} from "./asset-prompt-contracts"

export type DraftGenerationContract = {
  assetType: DraftAssetType
  sourceMissionId: string
  campaignId: string
  requiredInputs: string[]
  optionalInputs: string[]
  promptPurpose: string
  toneGuidelines: string[]
  citationRequirements: string[]
  reviewRequirements: string[]
  approvalRequirements: string[]
  outputSchema: ReturnType<typeof buildAssetPromptContract>["outputSchema"]
  riskFlags: string[]
  lineageRequirements: string[]
  generationExecuted: false
  publishingExecuted: false
  writesToPrisma: false
}

export type DraftGenerationContractSet = {
  campaignId: string
  sourceMissionId: string
  contracts: DraftGenerationContract[]
  generationExecuted: false
  publishingExecuted: false
  writesToPrisma: false
}

export function buildDraftGenerationContract(
  assetType: DraftAssetType,
  input: {
    campaign: ContentCampaign
    masterBrief: MasterContentBrief
  }
): DraftGenerationContract {
  const prompt = buildAssetPromptContract(assetType)

  return {
    assetType,
    sourceMissionId: input.campaign.parentMission,
    campaignId: input.campaign.id,
    requiredInputs: [
      "approvedResearchMission",
      "masterBrief",
      "verifiedClaims",
      "citations",
      "lineage",
      "riskFlags",
      "reviewPolicy",
    ],
    optionalInputs: optionalInputsFor(assetType),
    promptPurpose: prompt.promptPurpose,
    toneGuidelines: prompt.toneGuidelines,
    citationRequirements: [
      "Every factual claim must trace to a verified claim or citation from the master brief.",
      "Do not introduce uncited statistics, studies, organizations, quotes, or claims.",
      "Carry citation identifiers into the output schema for reviewer inspection.",
    ],
    reviewRequirements: [
      "Human editorial review is required before persistence or publication.",
      "Citation review is required before approval.",
      "Risk flags must be resolved or explicitly accepted by a reviewer.",
    ],
    approvalRequirements: [
      "Approval is never automatic.",
      "Approval must come from a separate governed approval flow.",
      "Approval does not publish or post content.",
    ],
    outputSchema: prompt.outputSchema,
    riskFlags: [...prompt.riskFlags, ...input.masterBrief.risks],
    lineageRequirements: [
      "researchMissionId",
      "evidenceIds",
      "consensusIds",
      "ontologyRecordIds",
      "reviewPackageIds",
      "masterBriefId",
      "assetId",
    ],
    generationExecuted: false,
    publishingExecuted: false,
    writesToPrisma: false,
  }
}

export function buildDraftGenerationContracts(input: {
  campaign: ContentCampaign
  masterBrief: MasterContentBrief
}): DraftGenerationContractSet {
  return {
    campaignId: input.campaign.id,
    sourceMissionId: input.campaign.parentMission,
    contracts: DRAFT_ASSET_TYPES.map((assetType) =>
      buildDraftGenerationContract(assetType, input)
    ),
    generationExecuted: false,
    publishingExecuted: false,
    writesToPrisma: false,
  }
}

export function summarizeDraftContracts(set: DraftGenerationContractSet) {
  return {
    campaignId: set.campaignId,
    sourceMissionId: set.sourceMissionId,
    contractCount: set.contracts.length,
    assetTypes: set.contracts.map((contract) => contract.assetType),
    generationExecuted: false,
    publishingExecuted: false,
    writesToPrisma: false,
  }
}

function optionalInputsFor(assetType: DraftAssetType) {
  switch (assetType) {
    case "article":
      return ["seoKeywords", "faqSeeds", "internalLinkTargets"]
    case "newsletter":
      return ["subscriberSegment", "personalizationNotes"]
    case "linkedin":
    case "x-twitter":
    case "threads":
    case "facebook":
      return ["platformLengthTarget", "variantCount", "visualPromptNotes"]
    case "youtube-script":
    case "shorts-script":
      return ["targetDuration", "visualBeatNotes", "thumbnailAngle"]
    case "podcast-outline":
      return ["targetDuration", "guestContext", "segmentTiming"]
    case "presentation-outline":
      return ["targetSlideCount", "speakerContext", "audienceSetting"]
    case "lead-magnet":
      return ["formatPreference", "worksheetDepth", "leadCaptureContext"]
    case "email-campaign":
      return ["sequenceLength", "audienceSegment", "offerContext"]
  }
}
