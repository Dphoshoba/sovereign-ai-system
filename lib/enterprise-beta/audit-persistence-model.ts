export type AuditPersistenceModel = {
  id: string
  recordType:
    | "guard-decision"
    | "evidence-packet"
    | "operator-intent"
    | "approval-review"
    | "rate-limit-event"
  requiredFields: string[]
  candidateStore: "existing-governance-audit" | "future-audit-ledger" | "external-archive"
  implementationMode: "PLANNED"
  persistenceActive: false
}

export function buildAuditPersistenceModels(): AuditPersistenceModel[] {
  return [
    {
      id: "audit-model-guard-decision",
      recordType: "guard-decision",
      requiredFields: ["decisionId", "actorId", "organizationId", "routePattern", "outcome"],
      candidateStore: "existing-governance-audit",
      implementationMode: "PLANNED",
      persistenceActive: false,
    },
    {
      id: "audit-model-evidence-packet",
      recordType: "evidence-packet",
      requiredFields: ["packetId", "decisionId", "evidenceIds", "reasoningId"],
      candidateStore: "future-audit-ledger",
      implementationMode: "PLANNED",
      persistenceActive: false,
    },
    {
      id: "audit-model-operator-intent",
      recordType: "operator-intent",
      requiredFields: ["intentId", "actorId", "actionId", "reason", "source"],
      candidateStore: "existing-governance-audit",
      implementationMode: "PLANNED",
      persistenceActive: false,
    },
    {
      id: "audit-model-rate-limit-event",
      recordType: "rate-limit-event",
      requiredFields: ["eventId", "actorId", "organizationId", "quotaId", "boundaryId"],
      candidateStore: "future-audit-ledger",
      implementationMode: "PLANNED",
      persistenceActive: false,
    },
  ]
}

export function evaluateAuditPersistenceCoverage(
  models: AuditPersistenceModel[] = buildAuditPersistenceModels()
) {
  const complete = models.filter(
    (model) => model.requiredFields.length >= 4 && !model.persistenceActive
  ).length

  return {
    score: Math.round((complete / models.length) * 82),
    status: "AUDIT_PERSISTENCE_MAPPED_NOT_IMPLEMENTED" as const,
    modelCount: models.length,
    persistenceActive: false,
  }
}
