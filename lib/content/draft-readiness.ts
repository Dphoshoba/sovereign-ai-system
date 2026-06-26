import type {
  DraftGenerationContract,
  DraftGenerationContractSet,
} from "./draft-generation-contracts"

export type DraftReadinessStatus =
  | "READY_FOR_DRAFT_PREVIEW"
  | "MISSING_REQUIRED_INPUTS"
  | "REVIEW_REQUIRED"
  | "BLOCKED"

export type DraftContractReadiness = {
  assetType: DraftGenerationContract["assetType"]
  status: DraftReadinessStatus
  score: number
  missingInputs: string[]
  blockers: string[]
  warnings: string[]
}

export type DraftReadinessResult = {
  campaignId: string
  overallScore: number
  status: DraftReadinessStatus
  generationExecuted: false
  publishingExecuted: false
  writesToPrisma: false
  contracts: DraftContractReadiness[]
  blockers: string[]
}

export function evaluateDraftContractReadiness(
  contract: DraftGenerationContract,
  availableInputs: string[]
): DraftContractReadiness {
  const available = new Set(availableInputs)
  const missingInputs = contract.requiredInputs.filter(
    (input) => !available.has(input)
  )
  const blockers: string[] = []
  const warnings: string[] = []

  if (contract.generationExecuted !== false) {
    blockers.push("Generation execution is not allowed in Phase 6B.")
  }

  if (contract.publishingExecuted !== false) {
    blockers.push("Publishing execution is not allowed in Phase 6B.")
  }

  if (contract.writesToPrisma !== false) {
    blockers.push("Database writes are not allowed in Phase 6B.")
  }

  if (contract.reviewRequirements.length > 0) {
    warnings.push("Human review is required before any generated draft is used.")
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - missingInputs.length * 12 - blockers.length * 35 - warnings.length * 4
    )
  )
  const status: DraftReadinessStatus =
    blockers.length > 0
      ? "BLOCKED"
      : missingInputs.length > 0
        ? "MISSING_REQUIRED_INPUTS"
        : warnings.length > 0
          ? "REVIEW_REQUIRED"
          : "READY_FOR_DRAFT_PREVIEW"

  return {
    assetType: contract.assetType,
    status,
    score,
    missingInputs,
    blockers,
    warnings,
  }
}

export function evaluateDraftReadiness(
  set: DraftGenerationContractSet,
  availableInputs: string[] = [
    "approvedResearchMission",
    "masterBrief",
    "verifiedClaims",
    "citations",
    "lineage",
    "riskFlags",
    "reviewPolicy",
  ]
): DraftReadinessResult {
  const contracts = set.contracts.map((contract) =>
    evaluateDraftContractReadiness(contract, availableInputs)
  )
  const blockers = contracts.flatMap((contract) =>
    contract.blockers.map((blocker) => `${contract.assetType}: ${blocker}`)
  )
  const overallScore = Math.round(
    contracts.reduce((sum, contract) => sum + contract.score, 0) /
      contracts.length
  )
  const status: DraftReadinessStatus =
    blockers.length > 0
      ? "BLOCKED"
      : contracts.some((contract) => contract.status === "MISSING_REQUIRED_INPUTS")
        ? "MISSING_REQUIRED_INPUTS"
        : contracts.some((contract) => contract.status === "REVIEW_REQUIRED")
          ? "REVIEW_REQUIRED"
          : "READY_FOR_DRAFT_PREVIEW"

  return {
    campaignId: set.campaignId,
    overallScore,
    status,
    generationExecuted: false,
    publishingExecuted: false,
    writesToPrisma: false,
    contracts,
    blockers,
  }
}
