import type {
  GovernedIngestionPlan,
} from "./governed-ingestion"
import type { GovernedIngestionDecision } from "../governance/ingestion-governance"

export type SemanticGraphTransactionMode =
  | "dry-run-preview"
  | "blocked"
  | "allowed-not-executed"

export type SemanticGraphTransactionRequest = {
  plan: GovernedIngestionPlan
  dryRun?: boolean
  explicitWriteEnabled?: boolean
  actorId?: string | null
  organizationId?: string | null
  workspaceId?: string | null
  reason?: string
}

export type SemanticGraphTransactionPreview = {
  recordsToCreate: GovernedIngestionPlan["executionPlan"]["recordsToCreate"]
  nodesToCreate: GovernedIngestionPlan["executionPlan"]["nodesToCreate"]
  edgesToCreate: GovernedIngestionPlan["executionPlan"]["edgesToCreate"]
  nodeKeyMap: GovernedIngestionPlan["executionPlan"]["nodeKeyMap"]
  governedDecision: GovernedIngestionDecision
  approvalRequired: boolean
  writesToPrisma: false
  databaseAccess: false
}

export type SemanticGraphTransactionValidation = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type SemanticGraphTransactionResult = {
  ok: boolean
  mode: SemanticGraphTransactionMode
  dryRun: boolean
  blocked: boolean
  executed: false
  writesToPrisma: false
  databaseAccess: false
  errors: string[]
  warnings: string[]
  preview: SemanticGraphTransactionPreview
  summary: string
}

export function executeSemanticGraphTransaction(
  request: SemanticGraphTransactionRequest
): SemanticGraphTransactionResult {
  const dryRun = request.dryRun !== false
  const preview = buildTransactionPreview(request)
  const validation = validateTransactionRequest({ ...request, dryRun })

  if (dryRun) {
    return {
      ok: validation.errors.length === 0,
      mode: "dry-run-preview",
      dryRun: true,
      blocked: false,
      executed: false,
      writesToPrisma: false,
      databaseAccess: false,
      errors: validation.errors,
      warnings: validation.warnings,
      preview,
      summary: "Dry-run transaction preview only. No Prisma writes are available in this slice.",
    }
  }

  if (!validation.valid) {
    return {
      ok: false,
      mode: "blocked",
      dryRun: false,
      blocked: true,
      executed: false,
      writesToPrisma: false,
      databaseAccess: false,
      errors: validation.errors,
      warnings: validation.warnings,
      preview,
      summary: "Write request blocked by transaction preconditions.",
    }
  }

  return {
    ok: true,
    mode: "allowed-not-executed",
    dryRun: false,
    blocked: false,
    executed: false,
    writesToPrisma: false,
    databaseAccess: false,
    errors: [],
    warnings: [
      ...validation.warnings,
      "Write preconditions passed, but this slice intentionally does not execute Prisma writes.",
    ],
    preview,
    summary: "Write request is allowed by policy but not executed in Phase 4C Slice 1.",
  }
}

export function validateTransactionRequest(
  request: SemanticGraphTransactionRequest
): SemanticGraphTransactionValidation {
  const dryRun = request.dryRun !== false
  const errors: string[] = []
  const warnings: string[] = []

  if (!request.plan) {
    errors.push("Governed ingestion plan is required.")
    return { valid: false, errors, warnings }
  }

  if (request.plan.errors.length > 0) {
    errors.push("Governed ingestion plan contains errors.")
  }

  if (request.plan.decision === "BLOCK") {
    errors.push("Governance decision BLOCK cannot be executed.")
  }

  if (dryRun) {
    if (request.explicitWriteEnabled) {
      warnings.push("explicitWriteEnabled is ignored while dryRun is true.")
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  if (request.explicitWriteEnabled !== true) {
    errors.push("explicitWriteEnabled must be true when dryRun is false.")
  }

  if (
    request.plan.decision !== "ALLOW" &&
    request.plan.decision !== "ALLOW_WITH_WARNING"
  ) {
    errors.push("Governance decision must be ALLOW or ALLOW_WITH_WARNING for write mode.")
  }

  if (request.plan.approvalRequired) {
    errors.push("approvalRequired must be false for this transaction slice.")
  }

  if (!request.actorId?.trim()) {
    errors.push("actorId is required when dryRun is false.")
  }

  if (!request.organizationId?.trim()) {
    errors.push("organizationId is required when dryRun is false.")
  }

  if (!request.workspaceId?.trim()) {
    errors.push("workspaceId is required when dryRun is false.")
  }

  if (request.plan.executionPlan.databaseAccess !== false) {
    errors.push("Execution plan must not request database access in this slice.")
  }

  if (request.plan.executionPlan.writesToPrisma !== false) {
    errors.push("Execution plan must not request Prisma writes in this slice.")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function buildTransactionPreview(
  request: SemanticGraphTransactionRequest
): SemanticGraphTransactionPreview {
  return {
    recordsToCreate: request.plan.executionPlan.recordsToCreate,
    nodesToCreate: request.plan.executionPlan.nodesToCreate,
    edgesToCreate: request.plan.executionPlan.edgesToCreate,
    nodeKeyMap: request.plan.executionPlan.nodeKeyMap,
    governedDecision: request.plan.decision,
    approvalRequired: request.plan.approvalRequired,
    writesToPrisma: false,
    databaseAccess: false,
  }
}

export function summarizeTransactionResult(
  result: SemanticGraphTransactionResult
) {
  return {
    ok: result.ok,
    mode: result.mode,
    dryRun: result.dryRun,
    blocked: result.blocked,
    executed: result.executed,
    writesToPrisma: result.writesToPrisma,
    databaseAccess: result.databaseAccess,
    records: result.preview.recordsToCreate.length,
    nodes: result.preview.nodesToCreate.length,
    edges: result.preview.edgesToCreate.length,
    errors: result.errors,
    warnings: result.warnings,
    summary: result.summary,
  }
}
