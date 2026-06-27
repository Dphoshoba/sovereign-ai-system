import { buildGuardDecisions } from "./guard-decision"
import { buildGuardEvidencePackets } from "./guard-evidence-packet"

export type GuardAuditRecord = {
  id: string
  decisionId: string
  packetId: string
  eventType: "guard.decision.previewed"
  auditSummary: string
  writesToPrisma: false
  persisted: false
}

export function buildGuardAuditRecords(): GuardAuditRecord[] {
  const decisions = buildGuardDecisions()
  const packets = buildGuardEvidencePackets()

  return decisions.map((decision) => ({
    id: `${decision.id}-audit`,
    decisionId: decision.id,
    packetId:
      packets.find((packet) => packet.decisionId === decision.id)?.id ??
      `${decision.id}-packet`,
    eventType: "guard.decision.previewed",
    auditSummary: `Previewed ${decision.outcome} for ${decision.routePattern}.`,
    writesToPrisma: false,
    persisted: false,
  }))
}

export function evaluateAuditCoverage(records: GuardAuditRecord[] = buildGuardAuditRecords()) {
  const explained = records.filter((record) => record.auditSummary.length > 0).length

  return {
    score: Math.round((explained / records.length) * 80),
    status: "AUDIT_RECORDS_MODELED_NOT_PERSISTED" as const,
    auditRecordCount: records.length,
    persisted: false,
    writesToPrisma: false,
  }
}
