import type { GovernedIngestionPlan } from "./governed-ingestion"
import type { IngestionReviewQueueItem } from "./ingestion-review-queue"

export type ReviewDecisionAction =
  | "APPROVE_CREATE"
  | "APPROVE_MATCH"
  | "APPROVE_MERGE"
  | "REJECT"
  | "REQUEST_MORE_INFORMATION"

export type ReviewDecisionRequest = {
  packageId?: string | null
  reviewItem: IngestionReviewQueueItem
  decision: ReviewDecisionAction
  actorId?: string | null
  organizationId?: string | null
  workspaceId?: string | null
  notes?: string | null
  evidence?: Record<string, unknown>
}

export type ReviewDecision = {
  packageId: string | null
  reviewItemId: string
  decision: ReviewDecisionAction
  actorId: string | null
  organizationId: string | null
  workspaceId: string | null
  status: "prepared"
  graphWriteCandidate: boolean
  graphWrites: false
  automaticApproval: false
  automaticExecution: false
  rationale: string
  notes: string | null
  evidence: Record<string, unknown>
}

export type ReviewDecisionValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type PreparedGraphWriteDecision = {
  readyForReadinessCheck: boolean
  graphWrites: false
  dryRun: true
  decision: ReviewDecision
  governedDecision: GovernedIngestionPlan["decision"] | null
  approvalRequired: boolean
  allowedNextStep: string
  blockedReason: string | null
  errors: string[]
  warnings: string[]
}

export type ReviewDecisionSummary = {
  valid: boolean
  decision: ReviewDecisionAction
  graphWriteCandidate: boolean
  graphWrites: false
  nextAction: string
  errors: string[]
  warnings: string[]
}

export function buildReviewDecision(
  request: ReviewDecisionRequest
): ReviewDecision {
  return {
    packageId: request.packageId ?? null,
    reviewItemId: request.reviewItem.id,
    decision: request.decision,
    actorId: request.actorId ?? null,
    organizationId: request.organizationId ?? null,
    workspaceId: request.workspaceId ?? null,
    status: "prepared",
    graphWriteCandidate: isApprovalDecision(request.decision),
    graphWrites: false,
    automaticApproval: false,
    automaticExecution: false,
    rationale: rationaleForDecision(request),
    notes: request.notes ?? null,
    evidence: {
      reviewReason: request.reviewItem.reason,
      targetType: request.reviewItem.targetType,
      targetId: request.reviewItem.targetId ?? null,
      recommendedDecision: request.reviewItem.recommendedDecision,
      reviewItemPayload: request.reviewItem.payload,
      ...request.evidence,
    },
  }
}

export function validateReviewDecision(
  decision: ReviewDecision
): ReviewDecisionValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!decision.reviewItemId.trim()) errors.push("reviewItemId is required.")
  if (!decision.actorId?.trim()) errors.push("actorId is required.")
  if (!decision.organizationId?.trim()) errors.push("organizationId is required.")

  if (!decision.packageId?.trim()) {
    warnings.push(
      "No persisted review package id was supplied; decision can be previewed but should not feed write readiness."
    )
  }

  if (decision.decision === "APPROVE_MERGE") {
    warnings.push(
      "APPROVE_MERGE is a preparation-only decision until merge semantics are implemented."
    )
  }

  if (
    decision.decision === "APPROVE_MATCH" &&
    typeof decision.evidence.targetId !== "string"
  ) {
    errors.push("APPROVE_MATCH requires an existing targetId.")
  }

  if (decision.graphWrites !== false) {
    errors.push("Review decisions must never write to the graph.")
  }

  if (decision.automaticApproval !== false || decision.automaticExecution !== false) {
    errors.push("Review decisions cannot auto-approve or auto-execute.")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function prepareGraphWriteDecision(input: {
  decision: ReviewDecision
  governedPlan?: GovernedIngestionPlan
}): PreparedGraphWriteDecision {
  const validation = validateReviewDecision(input.decision)
  const governedDecision = input.governedPlan?.decision ?? null
  const approvalDecision = isApprovalDecision(input.decision.decision)
  const governanceAllows =
    governedDecision === "ALLOW" || governedDecision === "ALLOW_WITH_WARNING"
  const blockedReason =
    validation.errors[0] ??
    (!approvalDecision
      ? "Decision does not approve a graph write candidate."
      : input.governedPlan?.approvalRequired
        ? "Governed plan still has approvalRequired: true."
        : governedDecision === "BLOCK"
          ? "Governance decision BLOCK cannot proceed to write readiness."
          : governedDecision === "REQUIRES_REVIEW"
            ? "Governance still requires review before write readiness."
            : !governanceAllows
              ? "Governance decision is not available."
              : null)

  return {
    readyForReadinessCheck:
      validation.valid &&
      approvalDecision &&
      governanceAllows &&
      input.governedPlan?.approvalRequired === false,
    graphWrites: false,
    dryRun: true,
    decision: input.decision,
    governedDecision,
    approvalRequired: input.governedPlan?.approvalRequired ?? true,
    allowedNextStep: blockedReason
      ? "Resolve the blocker before transaction preview."
      : "Run graph write readiness and guarded transaction preview. Do not execute writes automatically.",
    blockedReason,
    errors: validation.errors,
    warnings: validation.warnings,
  }
}

export function summarizeDecision(
  decision: ReviewDecision
): ReviewDecisionSummary {
  const validation = validateReviewDecision(decision)

  return {
    valid: validation.valid,
    decision: decision.decision,
    graphWriteCandidate: decision.graphWriteCandidate,
    graphWrites: false,
    nextAction: validation.valid
      ? decision.graphWriteCandidate
        ? "Evaluate graph write readiness; execution remains guarded and manual."
        : "Record the reviewer outcome and do not prepare graph execution."
      : "Fix decision validation errors before readiness evaluation.",
    errors: validation.errors,
    warnings: validation.warnings,
  }
}

function isApprovalDecision(decision: ReviewDecisionAction) {
  return (
    decision === "APPROVE_CREATE" ||
    decision === "APPROVE_MATCH" ||
    decision === "APPROVE_MERGE"
  )
}

function rationaleForDecision(request: ReviewDecisionRequest) {
  switch (request.decision) {
    case "APPROVE_CREATE":
      return "Reviewer prepared approval for creating a new graph entity if all readiness gates pass."
    case "APPROVE_MATCH":
      return "Reviewer prepared approval for matching the candidate to an existing graph entity if all readiness gates pass."
    case "APPROVE_MERGE":
      return "Reviewer prepared a merge decision for future merge semantics; no merge write is available in this slice."
    case "REJECT":
      return "Reviewer rejected the ingestion review item; no graph write should be prepared."
    case "REQUEST_MORE_INFORMATION":
      return "Reviewer requested more information; ingestion remains blocked from graph write readiness."
  }
}
