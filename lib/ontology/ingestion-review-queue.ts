import type {
  EntityResolutionDecision,
  EntityResolutionPlan,
  EntityResolutionOutcome,
} from "./entity-resolution"
import type { GovernedIngestionPlan } from "./governed-ingestion"

export type IngestionReviewDecision =
  | "APPROVE_CREATE"
  | "APPROVE_MATCH"
  | "REQUEST_CHANGES"
  | "REJECT"
  | "ESCALATE"

export type IngestionReviewReason =
  | "POSSIBLE_DUPLICATE"
  | "BLOCK_CONFLICT"
  | "REQUIRES_REVIEW"
  | "GOVERNANCE_BLOCK"
  | "LOW_CONFIDENCE"
  | "HIGH_DUPLICATE_RISK"

export type IngestionReviewQueueItem = {
  id: string
  title: string
  reason: IngestionReviewReason
  targetType: "KnowledgeGraphNode" | "SemanticGraphIngestionPlan"
  targetId?: string | null
  requestedBy: string
  priority: "low" | "medium" | "high" | "critical"
  riskLevel: "low" | "medium" | "high" | "critical"
  status: "pending"
  recommendedDecision: IngestionReviewDecision
  rationale: string
  entityOutcome?: EntityResolutionOutcome
  entity?: {
    name: string
    nodeType: string
    fingerprint: string
  }
  existingCandidate?: {
    id: string
    name: string
    nodeType: string
    similarityScore?: number
  }
  payload: Record<string, unknown>
}

export type ExistingApprovalShape = {
  title: string
  targetType: string
  targetId: string | null
  requestedBy: string
  requestedRole: string | null
  actionType: string
  targetLayer: string
  riskLevel: string
  status: "pending"
  rationale: string
  policyMatches: Array<{
    reason: IngestionReviewReason
    priority: IngestionReviewQueueItem["priority"]
  }>
  payload: Record<string, unknown>
}

export type IngestionReviewQueueSummary = {
  total: number
  pending: number
  critical: number
  high: number
  medium: number
  low: number
  reasons: Record<IngestionReviewReason, number>
  recommendedModel: "ExecutionAuthorizationRequest"
  writesToPrisma: false
  deletesFromPrisma: false
}

type BuildReviewItemsInput = {
  entityResolutionPlan?: EntityResolutionPlan
  governedPlan?: GovernedIngestionPlan
  requestedBy?: string
}

export function buildIngestionReviewItems(
  plan: EntityResolutionPlan | BuildReviewItemsInput
): IngestionReviewQueueItem[] {
  const input = isEntityResolutionPlan(plan)
    ? { entityResolutionPlan: plan }
    : plan
  const requestedBy = input.requestedBy ?? "semantic-graph-ingestion"
  const items: IngestionReviewQueueItem[] = []

  for (const decision of input.entityResolutionPlan?.possibleDuplicates ?? []) {
    items.push(buildEntityReviewItem(decision, requestedBy))
  }

  for (const decision of input.entityResolutionPlan?.blockedConflicts ?? []) {
    items.push(buildEntityReviewItem(decision, requestedBy))
  }

  if (
    input.entityResolutionPlan &&
    input.entityResolutionPlan.duplicateRiskScore >= 60
  ) {
    items.push({
      id: "review:entity-resolution:high-duplicate-risk",
      title: "High duplicate risk in semantic graph ingestion plan",
      reason: "HIGH_DUPLICATE_RISK",
      targetType: "SemanticGraphIngestionPlan",
      targetId: null,
      requestedBy,
      priority: "high",
      riskLevel: "high",
      status: "pending",
      recommendedDecision: "ESCALATE",
      rationale:
        "The entity resolution plan has elevated duplicate risk and should be reviewed before any write execution.",
      payload: {
        duplicateRiskScore: input.entityResolutionPlan.duplicateRiskScore,
        confidence: input.entityResolutionPlan.confidence,
        summary: {
          possibleDuplicates: input.entityResolutionPlan.possibleDuplicates.length,
          blockedConflicts: input.entityResolutionPlan.blockedConflicts.length,
        },
      },
    })
  }

  if (input.governedPlan?.decision === "REQUIRES_REVIEW") {
    items.push(buildGovernanceReviewItem(input.governedPlan, requestedBy))
  }

  if (input.governedPlan?.decision === "BLOCK") {
    items.push(buildGovernanceBlockItem(input.governedPlan, requestedBy))
  }

  return items
}

export function classifyReviewReason(
  item: IngestionReviewQueueItem
): IngestionReviewReason {
  if (item.reason) return item.reason
  if (item.entityOutcome === "POSSIBLE_DUPLICATE") return "POSSIBLE_DUPLICATE"
  if (item.entityOutcome === "BLOCK_CONFLICT") return "BLOCK_CONFLICT"

  return "REQUIRES_REVIEW"
}

export function summarizeReviewQueue(
  items: IngestionReviewQueueItem[]
): IngestionReviewQueueSummary {
  const reasons = emptyReasonCounts()

  for (const item of items) {
    reasons[classifyReviewReason(item)] += 1
  }

  return {
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    critical: items.filter((item) => item.priority === "critical").length,
    high: items.filter((item) => item.priority === "high").length,
    medium: items.filter((item) => item.priority === "medium").length,
    low: items.filter((item) => item.priority === "low").length,
    reasons,
    recommendedModel: "ExecutionAuthorizationRequest",
    writesToPrisma: false,
    deletesFromPrisma: false,
  }
}

export function mapReviewItemsToExistingApprovalShape(
  items: IngestionReviewQueueItem[]
): ExistingApprovalShape[] {
  return items.map((item) => ({
    title: item.title,
    targetType: item.targetType,
    targetId: item.targetId ?? null,
    requestedBy: item.requestedBy,
    requestedRole: null,
    actionType: "semantic-graph.ingestion-review",
    targetLayer: "semantic-graph",
    riskLevel: item.riskLevel,
    status: "pending",
    rationale: item.rationale,
    policyMatches: [
      {
        reason: item.reason,
        priority: item.priority,
      },
    ],
    payload: item.payload,
  }))
}

function buildEntityReviewItem(
  decision: EntityResolutionDecision,
  requestedBy: string
): IngestionReviewQueueItem {
  const reason =
    decision.outcome === "BLOCK_CONFLICT"
      ? "BLOCK_CONFLICT"
      : "POSSIBLE_DUPLICATE"
  const priority = reason === "BLOCK_CONFLICT" ? "critical" : "high"
  const riskLevel = reason === "BLOCK_CONFLICT" ? "critical" : "high"
  const existingName = decision.existing?.name
  const title = existingName
    ? `Review ${decision.entity.name} against ${existingName}`
    : `Review ${decision.entity.name}`

  return {
    id: `review:entity:${decision.fingerprint.semanticKey}:${reason.toLowerCase()}`,
    title,
    reason,
    targetType: "KnowledgeGraphNode",
    targetId: decision.existing?.id ?? null,
    requestedBy,
    priority,
    riskLevel,
    status: "pending",
    recommendedDecision:
      reason === "BLOCK_CONFLICT" ? "ESCALATE" : "REQUEST_CHANGES",
    rationale:
      reason === "BLOCK_CONFLICT"
        ? "A proposed entity conflicts with an existing entity and must be resolved before write execution."
        : "A proposed entity may duplicate an existing entity and needs a reviewer to approve create or match behavior.",
    entityOutcome: decision.outcome,
    entity: {
      name: decision.entity.name,
      nodeType: decision.entity.nodeType,
      fingerprint: decision.fingerprint.semanticKey,
    },
    existingCandidate: decision.existing
      ? {
          id: decision.existing.id,
          name: decision.existing.name,
          nodeType: decision.existing.nodeType,
          similarityScore: decision.similarity?.score,
        }
      : undefined,
    payload: {
      decision,
      allowedReviewerDecisions:
        reason === "BLOCK_CONFLICT"
          ? ["REQUEST_CHANGES", "REJECT", "ESCALATE"]
          : ["APPROVE_CREATE", "APPROVE_MATCH", "REQUEST_CHANGES", "REJECT"],
    },
  }
}

function buildGovernanceReviewItem(
  plan: GovernedIngestionPlan,
  requestedBy: string
): IngestionReviewQueueItem {
  return {
    id: `review:governance:${plan.requestId}:requires-review`,
    title: `Review governed ingestion ${plan.requestId}`,
    reason: plan.ontologyConfidence < 0.65 ? "LOW_CONFIDENCE" : "REQUIRES_REVIEW",
    targetType: "SemanticGraphIngestionPlan",
    targetId: plan.requestId,
    requestedBy,
    priority: plan.riskScore >= 60 ? "high" : "medium",
    riskLevel: plan.riskScore >= 60 ? "high" : "medium",
    status: "pending",
    recommendedDecision: "REQUEST_CHANGES",
    rationale:
      "Governance requires human review before this semantic graph ingestion plan can be considered for write execution.",
    payload: {
      requestId: plan.requestId,
      decision: plan.decision,
      riskScore: plan.riskScore,
      duplicateRisk: plan.duplicateRisk,
      ontologyConfidence: plan.ontologyConfidence,
      relationshipConfidence: plan.relationshipConfidence,
      governanceReasons: plan.governanceReasons,
      warnings: plan.warnings,
      errors: plan.errors,
    },
  }
}

function buildGovernanceBlockItem(
  plan: GovernedIngestionPlan,
  requestedBy: string
): IngestionReviewQueueItem {
  return {
    id: `review:governance:${plan.requestId}:block`,
    title: `Blocked governed ingestion ${plan.requestId}`,
    reason: "GOVERNANCE_BLOCK",
    targetType: "SemanticGraphIngestionPlan",
    targetId: plan.requestId,
    requestedBy,
    priority: "critical",
    riskLevel: "critical",
    status: "pending",
    recommendedDecision: "REJECT",
    rationale:
      "Governance blocked this semantic graph ingestion plan. It cannot be written without remediation and a new plan.",
    payload: {
      requestId: plan.requestId,
      decision: plan.decision,
      riskScore: plan.riskScore,
      duplicateRisk: plan.duplicateRisk,
      warnings: plan.warnings,
      errors: plan.errors,
      governanceReasons: plan.governanceReasons,
    },
  }
}

function isEntityResolutionPlan(
  value: EntityResolutionPlan | BuildReviewItemsInput
): value is EntityResolutionPlan {
  return "dryRun" in value && "possibleDuplicates" in value
}

function emptyReasonCounts(): Record<IngestionReviewReason, number> {
  return {
    POSSIBLE_DUPLICATE: 0,
    BLOCK_CONFLICT: 0,
    REQUIRES_REVIEW: 0,
    GOVERNANCE_BLOCK: 0,
    LOW_CONFIDENCE: 0,
    HIGH_DUPLICATE_RISK: 0,
  }
}
