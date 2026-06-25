import type {
  GovernedIngestionPlan,
  GovernedIngestionRequest,
} from "../ontology/governed-ingestion"

export type GovernedIngestionAudit = {
  auditId: string
  createdAt: string
  requestId: string
  requestedBy: string
  source: string
  dryRun: true
  decision: GovernedIngestionPlan["decision"]
  approvalRequired: boolean
  riskScore: number
  duplicateRisk: number
  ontologyConfidence: number
  relationshipConfidence: number
  recordsPlanned: number
  nodesPlanned: number
  edgesPlanned: number
  warnings: string[]
  errors: string[]
  writesToPrisma: false
  databaseAccess: false
}

export function buildAuditRecord(
  request: GovernedIngestionRequest,
  plan: GovernedIngestionPlan
): GovernedIngestionAudit {
  return {
    auditId: `audit-${plan.requestId}`,
    createdAt: new Date(0).toISOString(),
    requestId: plan.requestId,
    requestedBy: request.requestedBy ?? "system",
    source: request.source ?? "ontology",
    dryRun: true,
    decision: plan.decision,
    approvalRequired: plan.approvalRequired,
    riskScore: plan.riskScore,
    duplicateRisk: plan.duplicateRisk,
    ontologyConfidence: plan.ontologyConfidence,
    relationshipConfidence: plan.relationshipConfidence,
    recordsPlanned: plan.executionPlan.recordsToCreate.length,
    nodesPlanned: plan.executionPlan.nodesToCreate.length,
    edgesPlanned: plan.executionPlan.edgesToCreate.length,
    warnings: plan.warnings,
    errors: plan.errors,
    writesToPrisma: false,
    databaseAccess: false,
  }
}
