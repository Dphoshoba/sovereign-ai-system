import {
  evaluateGovernanceRules,
  type GovernedIngestionDecision,
} from "../governance/ingestion-governance"
import {
  buildAuditRecord,
  type GovernedIngestionAudit,
} from "../governance/ingestion-audit"
import {
  createSemanticGraphIngestionPlan,
  summarizeIngestionPlan,
  validateIngestionPlan,
  type SemanticGraphIngestionPlan,
  type SemanticGraphIngestionSummary,
} from "./semantic-graph-ingestion"
import type { SemanticGraphPayload } from "./semantic-graph-adapter"

export type GovernedIngestionRequest = {
  requestId?: string
  payload: SemanticGraphPayload
  requestedBy?: string
  source?: string
  reason?: string
  dryRun?: true
  approvalContext?: {
    reviewRequired?: boolean
    approvedBy?: string | null
    notes?: string
  }
}

export type GovernedValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
  riskScore: number
  duplicateRisk: number
  ontologyConfidence: number
  relationshipConfidence: number
}

export type GovernedExecutionPlan = {
  dryRun: true
  status: "planned-not-executable"
  writesToPrisma: false
  databaseAccess: false
  transactionMode: "future-phase-4c-only"
  recordsToCreate: SemanticGraphIngestionPlan["recordsToCreate"]
  nodesToCreate: SemanticGraphIngestionPlan["nodesToCreate"]
  edgesToCreate: SemanticGraphIngestionPlan["edgesToCreate"]
  nodeKeyMap: SemanticGraphIngestionPlan["nodeKeyMap"]
}

export type GovernedIngestionPlan = {
  requestId: string
  dryRun: true
  decision: GovernedIngestionDecision
  approvalRequired: boolean
  riskScore: number
  duplicateRisk: number
  ontologyConfidence: number
  relationshipConfidence: number
  validation: GovernedValidationResult
  executionPlan: GovernedExecutionPlan
  ingestionSummary: SemanticGraphIngestionSummary
  warnings: string[]
  errors: string[]
  governanceReasons: string[]
  audit: GovernedIngestionAudit
}

export type GovernedPlanSummary = {
  requestId: string
  dryRun: true
  decision: GovernedIngestionDecision
  approvalRequired: boolean
  riskScore: number
  duplicateRisk: number
  ontologyConfidence: number
  relationshipConfidence: number
  writesToPrisma: false
  databaseAccess: false
  records: number
  nodes: number
  edges: number
  warnings: string[]
  errors: string[]
  nextAction: string
}

export function validateGovernedIngestion(
  request: GovernedIngestionRequest
): GovernedValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!request.payload) {
    errors.push("payload is required")
    return {
      valid: false,
      errors,
      warnings,
      riskScore: 100,
      duplicateRisk: 100,
      ontologyConfidence: 0,
      relationshipConfidence: 0,
    }
  }

  if (request.dryRun !== undefined && request.dryRun !== true) {
    errors.push("Only dryRun requests are allowed in Phase 4B.5")
  }

  const ingestionPlan = createSemanticGraphIngestionPlan(request.payload)
  const ingestionValidation = validateIngestionPlan(ingestionPlan)
  const duplicateRisk = calculateDuplicateRisk(request.payload)
  const ontologyConfidence = confidenceFromRecord(request.payload)
  const relationshipConfidence = confidenceFromRelationships(request.payload)
  const riskScore = calculateRiskScore({
    errors: ingestionValidation.errors.length,
    warnings: ingestionValidation.warnings.length,
    duplicateRisk,
    ontologyConfidence,
    relationshipConfidence,
  })

  if (request.payload.edges.length === 0) {
    warnings.push("Payload has no relationships; graph value may be low.")
  }

  return {
    valid: errors.length === 0 && ingestionValidation.valid,
    errors: [...errors, ...ingestionValidation.errors],
    warnings: [...warnings, ...ingestionValidation.warnings],
    riskScore,
    duplicateRisk,
    ontologyConfidence,
    relationshipConfidence,
  }
}

export function buildGovernedExecutionPlan(
  request: GovernedIngestionRequest
): GovernedIngestionPlan {
  const requestId = request.requestId ?? stableRequestId(request.payload.record.title)
  const validation = validateGovernedIngestion(request)
  const ingestionPlan = createSemanticGraphIngestionPlan(request.payload)
  const governance = evaluateGovernanceRules({
    dryRun: true,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    riskScore: validation.riskScore,
    duplicateRisk: validation.duplicateRisk,
    ontologyConfidence: validation.ontologyConfidence,
    relationshipConfidence: validation.relationshipConfidence,
  })

  const executionPlan: GovernedExecutionPlan = {
    dryRun: true,
    status: "planned-not-executable",
    writesToPrisma: false,
    databaseAccess: false,
    transactionMode: "future-phase-4c-only",
    recordsToCreate: ingestionPlan.recordsToCreate,
    nodesToCreate: ingestionPlan.nodesToCreate,
    edgesToCreate: ingestionPlan.edgesToCreate,
    nodeKeyMap: ingestionPlan.nodeKeyMap,
  }

  const planWithoutAudit = {
    requestId,
    dryRun: true as const,
    decision: governance.decision,
    approvalRequired:
      governance.approvalRequired ||
      Boolean(request.approvalContext?.reviewRequired),
    riskScore: validation.riskScore,
    duplicateRisk: validation.duplicateRisk,
    ontologyConfidence: validation.ontologyConfidence,
    relationshipConfidence: validation.relationshipConfidence,
    validation,
    executionPlan,
    ingestionSummary: summarizeIngestionPlan(ingestionPlan),
    warnings: governance.warnings,
    errors: governance.errors,
    governanceReasons: governance.reasons,
  }

  const plan: GovernedIngestionPlan = {
    ...planWithoutAudit,
    audit: buildAuditRecord(request, planWithoutAudit as GovernedIngestionPlan),
  }

  return plan
}

export function summarizeGovernedPlan(
  plan: GovernedIngestionPlan
): GovernedPlanSummary {
  return {
    requestId: plan.requestId,
    dryRun: true,
    decision: plan.decision,
    approvalRequired: plan.approvalRequired,
    riskScore: plan.riskScore,
    duplicateRisk: plan.duplicateRisk,
    ontologyConfidence: plan.ontologyConfidence,
    relationshipConfidence: plan.relationshipConfidence,
    writesToPrisma: false,
    databaseAccess: false,
    records: plan.executionPlan.recordsToCreate.length,
    nodes: plan.executionPlan.nodesToCreate.length,
    edges: plan.executionPlan.edgesToCreate.length,
    warnings: plan.warnings,
    errors: plan.errors,
    nextAction:
      plan.decision === "BLOCK"
        ? "Fix validation or confidence issues before another dry-run."
        : plan.approvalRequired
          ? "Send the plan to human review before Phase 4C write enablement."
          : "Keep dry-run logs; no database write is available in this phase.",
  }
}

function calculateDuplicateRisk(payload: SemanticGraphPayload) {
  const names = payload.nodes.map((node) => node.name.trim().toLowerCase())
  const keys = Object.values(payload.references.nodeKeys)
  const uniqueNames = new Set(names)
  const uniqueKeys = new Set(keys)
  const duplicateNameCount = names.length - uniqueNames.size
  const duplicateKeyCount = keys.length - uniqueKeys.size
  const duplicateCount = duplicateNameCount + duplicateKeyCount

  if (payload.nodes.length === 0) return 75

  return Math.min(100, Math.round((duplicateCount / payload.nodes.length) * 100))
}

function confidenceFromRecord(payload: SemanticGraphPayload) {
  return clamp(payload.record.confidence ?? 0.75, 0, 1)
}

function confidenceFromRelationships(payload: SemanticGraphPayload) {
  if (payload.edges.length === 0) return 0.5

  const total = payload.edges.reduce((sum, edge) => {
    const evidenceConfidence =
      typeof edge.evidence.confidence === "number" ? edge.evidence.confidence : null

    return sum + (evidenceConfidence ?? edge.strength ?? 0.5)
  }, 0)

  return clamp(total / payload.edges.length, 0, 1)
}

function calculateRiskScore(input: {
  errors: number
  warnings: number
  duplicateRisk: number
  ontologyConfidence: number
  relationshipConfidence: number
}) {
  const confidenceRisk =
    (1 - input.ontologyConfidence) * 35 +
    (1 - input.relationshipConfidence) * 25
  const duplicateRisk = input.duplicateRisk * 0.25
  const validationRisk = input.errors * 25 + input.warnings * 5

  return Math.min(
    100,
    Math.round(confidenceRisk + duplicateRisk + validationRisk)
  )
}

function stableRequestId(title: string) {
  return `governed-ingestion:${title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
