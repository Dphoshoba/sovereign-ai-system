import { evaluateAuditCoverage } from "./guard-audit"
import { evaluateEvidencePacketReadiness } from "./guard-evidence-packet"
import { buildGuardExplainability } from "./guard-explainability"

export function buildGuardAuditReadiness() {
  const audit = evaluateAuditCoverage()
  const packet = evaluateEvidencePacketReadiness()
  const explainability = buildGuardExplainability()
  const auditReadiness = Math.round(
    [audit.score, packet.score, explainability.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )

  return {
    score: auditReadiness,
    status: "GUARD_AUDIT_READY_NOT_PERSISTED" as const,
    auditCoverage: audit.score,
    packetReadiness: packet.score,
    explainabilityReadiness: explainability.score,
    persisted: false,
    writesToPrisma: false,
  }
}
