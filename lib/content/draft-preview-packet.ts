import type { DraftAssetType } from "./asset-prompt-contracts"
import type { MasterContentBrief } from "./content-brief"
import type {
  ContentAsset,
  ContentCampaign,
  ContentCitation,
  ContentLineage,
} from "./content-campaign"
import {
  buildContentLineagePath,
  validateContentLineage,
} from "./content-lineage"
import type { DraftGenerationContract } from "./draft-generation-contracts"

export type DraftPreviewValidationStatus =
  | "READY_FOR_GENERATION"
  | "BLOCKED"
  | "REVIEW_REQUIRED"

export type DraftPreviewValidationCheck = {
  name: string
  passed: boolean
  status: DraftPreviewValidationStatus
  detail: string
}

export type DraftPreviewPacket = {
  assetType: DraftAssetType
  campaignId: string
  missionId: string
  masterBriefReference: {
    id: string
    topic: string
    version: number
  }
  promptContractReference: {
    assetType: DraftAssetType
    requiredInputs: string[]
    outputFormat: DraftGenerationContract["outputSchema"]["format"]
  }
  requiredInputs: string[]
  verifiedClaims: string[]
  citations: ContentCitation[]
  lineage: ContentLineage & {
    assetId: string
    path: ReturnType<typeof buildContentLineagePath>
  }
  readinessStatus: DraftPreviewValidationStatus
  reviewRequirements: string[]
  approvalRequirements: string[]
  estimatedPromptSize: number
  validationChecklist: DraftPreviewValidationCheck[]
  missingRequirements: string[]
  generatedText: null
  generationExecuted: false
  writesToPrisma: false
  publishingExecuted: false
  socialPostingExecuted: false
  automaticApprovals: false
}

export function buildDraftPreviewPacket(input: {
  asset: ContentAsset
  campaign: ContentCampaign
  masterBrief: MasterContentBrief
  contract: DraftGenerationContract
}): DraftPreviewPacket {
  const checklist = validateDraftPreviewPacket(input)
  const blockingChecks = checklist.filter(
    (check) => !check.passed && check.status === "BLOCKED"
  )
  const reviewChecks = checklist.filter(
    (check) => check.status === "REVIEW_REQUIRED"
  )
  const readinessStatus: DraftPreviewValidationStatus =
    blockingChecks.length > 0
      ? "BLOCKED"
      : reviewChecks.length > 0
        ? "REVIEW_REQUIRED"
        : "READY_FOR_GENERATION"

  return {
    assetType: input.contract.assetType,
    campaignId: input.campaign.id,
    missionId: input.campaign.parentMission,
    masterBriefReference: {
      id: input.masterBrief.id,
      topic: input.masterBrief.topic,
      version: input.masterBrief.version,
    },
    promptContractReference: {
      assetType: input.contract.assetType,
      requiredInputs: input.contract.requiredInputs,
      outputFormat: input.contract.outputSchema.format,
    },
    requiredInputs: input.contract.requiredInputs,
    verifiedClaims: input.masterBrief.verifiedClaims,
    citations: input.masterBrief.citations,
    lineage: {
      ...input.asset.lineage,
      assetId: input.asset.id,
      path: buildContentLineagePath(input.asset),
    },
    readinessStatus,
    reviewRequirements: input.contract.reviewRequirements,
    approvalRequirements: input.contract.approvalRequirements,
    estimatedPromptSize: estimatePromptSize(input.contract, input.masterBrief),
    validationChecklist: checklist,
    missingRequirements: checklist
      .filter((check) => !check.passed)
      .map((check) => check.name),
    generatedText: null,
    generationExecuted: false,
    writesToPrisma: false,
    publishingExecuted: false,
    socialPostingExecuted: false,
    automaticApprovals: false,
  }
}

export function validateDraftPreviewPacket(input: {
  asset: ContentAsset
  campaign: ContentCampaign
  masterBrief: MasterContentBrief
  contract: DraftGenerationContract | undefined
}): DraftPreviewValidationCheck[] {
  const lineageValidation = validateContentLineage(input.asset.lineage)
  const citationsSatisfied =
    input.masterBrief.citations.length > 0 &&
    input.masterBrief.verifiedClaims.length > 0
  const governanceIntact =
    input.campaign.governance.noPublishing &&
    input.campaign.governance.noSocialPosting &&
    input.campaign.governance.noAutomaticApproval &&
    input.campaign.governance.noGraphWrites &&
    input.campaign.governance.reviewRequired

  return [
    {
      name: "Mission exists",
      passed: input.campaign.parentMission.trim().length > 0,
      status: input.campaign.parentMission.trim() ? "READY_FOR_GENERATION" : "BLOCKED",
      detail: "A preview packet must be tied to an approved research mission.",
    },
    {
      name: "Master brief exists",
      passed: input.masterBrief.id.trim().length > 0,
      status: input.masterBrief.id.trim() ? "READY_FOR_GENERATION" : "BLOCKED",
      detail: "A master brief reference is required for every draft preview packet.",
    },
    {
      name: "Prompt contract exists",
      passed: Boolean(input.contract),
      status: input.contract ? "READY_FOR_GENERATION" : "BLOCKED",
      detail: "A Phase 6B prompt contract must exist before preview assembly.",
    },
    {
      name: "Citation requirements satisfied",
      passed: citationsSatisfied,
      status: citationsSatisfied ? "READY_FOR_GENERATION" : "BLOCKED",
      detail: "Verified claims and citations must be present before any future generation.",
    },
    {
      name: "Lineage complete",
      passed: lineageValidation.valid && lineageValidation.lineageComplete,
      status:
        lineageValidation.valid && lineageValidation.lineageComplete
          ? "READY_FOR_GENERATION"
          : "BLOCKED",
      detail: lineageValidation.valid
        ? "Lineage includes evidence, consensus, ontology, review package, and master brief links."
        : lineageValidation.errors.join(" "),
    },
    {
      name: "Governance intact",
      passed: governanceIntact,
      status: governanceIntact ? "REVIEW_REQUIRED" : "BLOCKED",
      detail:
        "Governance requires human review and blocks automatic approval, publishing, social posting, and graph writes.",
    },
    {
      name: "Review package available",
      passed: input.asset.lineage.reviewPackageIds.length > 0,
      status:
        input.asset.lineage.reviewPackageIds.length > 0
          ? "REVIEW_REQUIRED"
          : "BLOCKED",
      detail: "A review package is required before draft generation can be authorized.",
    },
  ]
}

function estimatePromptSize(
  contract: DraftGenerationContract,
  masterBrief: MasterContentBrief
) {
  return JSON.stringify({
    assetType: contract.assetType,
    requiredInputs: contract.requiredInputs,
    purpose: contract.promptPurpose,
    claims: masterBrief.verifiedClaims,
    citations: masterBrief.citations.map((citation) => citation.id),
    risks: masterBrief.risks,
  }).length
}
