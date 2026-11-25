import {
  buildComplianceWindows,
  evaluateComplianceWindowCoverage,
} from "./compliance-window"
import {
  buildEvidenceRetentionRules,
  evaluateEvidenceRetentionCoverage,
} from "./evidence-retention"
import { buildRetentionPolicies, evaluateRetentionCoverage } from "./retention-policy"

export function buildRetentionReadiness() {
  const policies = buildRetentionPolicies()
  const evidenceRules = buildEvidenceRetentionRules()
  const windows = buildComplianceWindows()
  const retention = evaluateRetentionCoverage(policies)
  const evidence = evaluateEvidenceRetentionCoverage(evidenceRules)
  const compliance = evaluateComplianceWindowCoverage(windows)
  const retentionScore = Math.round(
    [retention.score, evidence.score, compliance.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )

  return {
    score: retentionScore,
    status: "RETENTION_PLANNING_READY_NOT_ACTIVE" as const,
    retentionCoverage: retention.score,
    evidenceRetentionCoverage: evidence.score,
    complianceCoverage: compliance.score,
    policies,
    evidenceRules,
    windows,
  }
}
