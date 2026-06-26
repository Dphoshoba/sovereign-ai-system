import type { EntityResolutionPlan } from "./entity-resolution"
import type { GovernedIngestionPlan } from "./governed-ingestion"
import type { IngestionReviewQueueItem } from "./ingestion-review-queue"
import type { IngestionReviewPackageResult } from "./ingestion-review-package"
import type { PreparedGraphWriteDecision } from "./review-decision-pipeline"
import type { SemanticGraphTransactionResult } from "./semantic-graph-transaction-executor"

export type GraphWriteReadinessStatus = "READY" | "NOT_READY" | "BLOCKED"

export type GraphWriteChecklistItem = {
  key:
    | "governance"
    | "approval"
    | "entityResolution"
    | "duplicateResolution"
    | "reviewPackage"
    | "transactionExecutor"
    | "tenantScope"
    | "auditRequirements"
  label: string
  status: GraphWriteReadinessStatus
  required: boolean
  detail: string
}

export type GraphWriteReadinessInput = {
  governedPlan: GovernedIngestionPlan
  entityResolutionPlan: EntityResolutionPlan
  reviewItems: IngestionReviewQueueItem[]
  reviewPackage?: Pick<
    IngestionReviewPackageResult,
    "ok" | "createdPackageIds" | "graphWrites"
  > | null
  preparedDecision?: PreparedGraphWriteDecision | null
  transactionPreview?: SemanticGraphTransactionResult | null
  actorId?: string | null
  organizationId?: string | null
  workspaceId?: string | null
}

export type GraphWriteReadinessResult = {
  status: GraphWriteReadinessStatus
  completion: number
  graphWrites: false
  automaticExecution: false
  checklist: GraphWriteChecklistItem[]
  blockers: string[]
  warnings: string[]
  nextAction: string
}

export function buildGraphWriteChecklist(
  input: GraphWriteReadinessInput
): GraphWriteChecklistItem[] {
  const governanceReady =
    input.governedPlan.decision === "ALLOW" ||
    input.governedPlan.decision === "ALLOW_WITH_WARNING"
  const governanceBlocked = input.governedPlan.decision === "BLOCK"
  const approvalReady =
    input.preparedDecision?.readyForReadinessCheck === true &&
    input.preparedDecision.decision.graphWriteCandidate
  const hasReviewPackage =
    input.reviewPackage?.ok === true &&
    (input.reviewPackage.createdPackageIds?.length ?? 0) > 0
  const entityResolutionBlocked =
    input.entityResolutionPlan.blockedConflicts.length > 0 ||
    input.entityResolutionPlan.errors.length > 0
  const duplicateResolved =
    input.entityResolutionPlan.possibleDuplicates.length === 0 ||
    approvalReady
  const transactionPreviewReady =
    input.transactionPreview?.dryRun === true &&
    input.transactionPreview.writesToPrisma === false &&
    input.transactionPreview.executed === false
  const tenantReady = Boolean(input.actorId && input.organizationId && input.workspaceId)
  const auditReady =
    Boolean(input.governedPlan.audit) &&
    hasReviewPackage &&
    Boolean(input.preparedDecision?.decision.packageId)

  return [
    {
      key: "governance",
      label: "Governance",
      status: governanceBlocked
        ? "BLOCKED"
        : governanceReady
          ? "READY"
          : "NOT_READY",
      required: true,
      detail: `Governance decision is ${input.governedPlan.decision}.`,
    },
    {
      key: "approval",
      label: "Approval",
      status: approvalReady ? "READY" : "NOT_READY",
      required: true,
      detail: approvalReady
        ? "Human review decision is prepared for readiness evaluation."
        : "A human approval decision is still required.",
    },
    {
      key: "entityResolution",
      label: "Entity Resolution",
      status: entityResolutionBlocked ? "BLOCKED" : "READY",
      required: true,
      detail: entityResolutionBlocked
        ? "Entity resolution has blocked conflicts or errors."
        : "Entity resolution has no blocking errors.",
    },
    {
      key: "duplicateResolution",
      label: "Duplicate Resolution",
      status: duplicateResolved ? "READY" : "NOT_READY",
      required: true,
      detail: duplicateResolved
        ? "Duplicate candidates are absent or covered by the prepared review decision."
        : "Possible duplicates still need reviewer disposition.",
    },
    {
      key: "reviewPackage",
      label: "Review Package",
      status: hasReviewPackage ? "READY" : "NOT_READY",
      required: true,
      detail: hasReviewPackage
        ? "A pending ExecutionAuthorizationRequest package exists."
        : "Persisted review package is required before write readiness.",
    },
    {
      key: "transactionExecutor",
      label: "Transaction Executor",
      status: transactionPreviewReady ? "READY" : "NOT_READY",
      required: true,
      detail: transactionPreviewReady
        ? "Guarded transaction executor returned preview-only output."
        : "Transaction executor preview is required; no execution is allowed here.",
    },
    {
      key: "tenantScope",
      label: "Tenant Scope",
      status: tenantReady ? "READY" : "NOT_READY",
      required: true,
      detail: tenantReady
        ? "actorId, organizationId, and workspaceId are present for future guarded execution."
        : "actorId, organizationId, and workspaceId are required.",
    },
    {
      key: "auditRequirements",
      label: "Audit Requirements",
      status: auditReady ? "READY" : "NOT_READY",
      required: true,
      detail: auditReady
        ? "Governed audit context and review package traceability are present."
        : "Audit context must include governed audit plus persisted review package id.",
    },
  ]
}

export function evaluateGraphWriteReadiness(
  input: GraphWriteReadinessInput
): GraphWriteReadinessResult {
  const checklist = buildGraphWriteChecklist(input)
  const blockers = checklist
    .filter((item) => item.status === "BLOCKED")
    .map((item) => `${item.label}: ${item.detail}`)
  const notReady = checklist
    .filter((item) => item.status === "NOT_READY")
    .map((item) => `${item.label}: ${item.detail}`)
  const readyCount = checklist.filter((item) => item.status === "READY").length
  const completion = Math.round((readyCount / checklist.length) * 100)
  const status: GraphWriteReadinessStatus =
    blockers.length > 0 ? "BLOCKED" : notReady.length > 0 ? "NOT_READY" : "READY"

  return {
    status,
    completion,
    graphWrites: false,
    automaticExecution: false,
    checklist,
    blockers: [...blockers, ...notReady],
    warnings: [
      ...input.governedPlan.warnings,
      ...input.entityResolutionPlan.warnings,
      ...(input.preparedDecision?.warnings ?? []),
      ...(input.transactionPreview?.warnings ?? []),
    ],
    nextAction:
      status === "READY"
        ? "Eligible for a separately approved guarded transaction request; no automatic write is allowed."
        : "Resolve readiness blockers before any guarded transaction request.",
  }
}

export function summarizeGraphReadiness(result: GraphWriteReadinessResult) {
  return {
    status: result.status,
    completion: result.completion,
    graphWrites: false,
    automaticExecution: false,
    ready: result.checklist.filter((item) => item.status === "READY").length,
    notReady: result.checklist.filter((item) => item.status === "NOT_READY")
      .length,
    blocked: result.checklist.filter((item) => item.status === "BLOCKED")
      .length,
    nextAction: result.nextAction,
  }
}
