export type EvidenceRetentionRule = {
  id: string
  evidenceType:
    | "claim-check"
    | "permission-check"
    | "tenant-boundary"
    | "approval-boundary"
    | "rate-limit-boundary"
  retentionPolicyId: string
  archiveRequired: boolean
  redactionRequired: boolean
  active: false
}

export function buildEvidenceRetentionRules(): EvidenceRetentionRule[] {
  return [
    {
      id: "evidence-claim-check",
      evidenceType: "claim-check",
      retentionPolicyId: "retention-evidence",
      archiveRequired: true,
      redactionRequired: true,
      active: false,
    },
    {
      id: "evidence-permission-check",
      evidenceType: "permission-check",
      retentionPolicyId: "retention-governance",
      archiveRequired: true,
      redactionRequired: false,
      active: false,
    },
    {
      id: "evidence-tenant-boundary",
      evidenceType: "tenant-boundary",
      retentionPolicyId: "retention-security",
      archiveRequired: true,
      redactionRequired: true,
      active: false,
    },
    {
      id: "evidence-rate-limit-boundary",
      evidenceType: "rate-limit-boundary",
      retentionPolicyId: "retention-usage",
      archiveRequired: true,
      redactionRequired: true,
      active: false,
    },
  ]
}

export function evaluateEvidenceRetentionCoverage(
  rules: EvidenceRetentionRule[] = buildEvidenceRetentionRules()
) {
  const archived = rules.filter((rule) => rule.archiveRequired).length
  const redacted = rules.filter((rule) => rule.redactionRequired).length

  return {
    score: Math.round((archived / rules.length) * 55 + (redacted / rules.length) * 30),
    status: "EVIDENCE_RETENTION_MAPPED_NOT_ACTIVE" as const,
    ruleCount: rules.length,
    active: false,
  }
}
