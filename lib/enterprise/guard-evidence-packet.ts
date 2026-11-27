import { buildEnterpriseAuditEventTaxonomy, evaluateAuditCoverage } from "./audit-event-taxonomy"
import { buildGuardEvidenceItems, evaluateEvidenceCoverage } from "./guard-evidence"

export type GuardEvidencePacket = {
  id: string
  status: "preview-only"
  auditEvents: ReturnType<typeof buildEnterpriseAuditEventTaxonomy>
  evidenceItems: ReturnType<typeof buildGuardEvidenceItems>
  auditCoverage: ReturnType<typeof evaluateAuditCoverage>
  evidenceCoverage: ReturnType<typeof evaluateEvidenceCoverage>
  persistence: false
  databaseWrites: false
}

export function buildGuardEvidencePacket(): GuardEvidencePacket {
  const auditEvents = buildEnterpriseAuditEventTaxonomy()
  const evidenceItems = buildGuardEvidenceItems()

  return {
    id: "ea4-guard-evidence-preview",
    status: "preview-only",
    auditEvents,
    evidenceItems,
    auditCoverage: evaluateAuditCoverage(auditEvents),
    evidenceCoverage: evaluateEvidenceCoverage(evidenceItems),
    persistence: false,
    databaseWrites: false,
  }
}

