import { evaluateAuditCoverage } from "./audit-event-taxonomy"
import { evaluateGuardObservability } from "./boundary-observability"
import { evaluateComplianceReadiness } from "./enterprise-compliance-surface"
import { evaluateEvidenceCoverage } from "./guard-evidence"

export type EnterpriseTrustModel = {
  trustScore: number
  status: "TRUST_MODEL_READY_FOR_PLANNING"
  trustInputs: {
    auditCoverage: number
    evidenceCoverage: number
    guardObservability: number
    complianceReadiness: number
  }
  trustLimits: string[]
}

export function buildEnterpriseTrustModel(): EnterpriseTrustModel {
  const auditCoverage = evaluateAuditCoverage().score
  const evidenceCoverage = evaluateEvidenceCoverage().score
  const guardObservability = evaluateGuardObservability().score
  const complianceReadiness = evaluateComplianceReadiness().score
  const trustScore = Math.round(
    [auditCoverage, evidenceCoverage, guardObservability, complianceReadiness].reduce(
      (sum, score) => sum + score,
      0
    ) / 4
  )

  return {
    trustScore,
    status: "TRUST_MODEL_READY_FOR_PLANNING",
    trustInputs: {
      auditCoverage,
      evidenceCoverage,
      guardObservability,
      complianceReadiness,
    },
    trustLimits: [
      "Trust is based on contracts, not persisted runtime evidence.",
      "No telemetry backend is integrated.",
      "No authentication provider is integrated.",
      "No execution or publishing is enabled.",
    ],
  }
}

