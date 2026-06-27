import { buildEnterpriseGuardReadinessAudit } from "./enterprise-readiness-audit"

export type GuardEvidenceItem = {
  id: string
  guardFamily: string
  evidenceType: "contract" | "score" | "constraint" | "risk"
  description: string
  source: string
  persisted: false
  writesToPrisma: false
}

export function buildGuardEvidenceItems(): GuardEvidenceItem[] {
  const guardAudit = buildEnterpriseGuardReadinessAudit()

  return [
    {
      id: "tenant-isolation-score",
      guardFamily: "tenant",
      evidenceType: "score",
      description: `Tenant isolation score is ${guardAudit.tenantIsolationScore}.`,
      source: "enterprise-readiness-audit",
      persisted: false,
      writesToPrisma: false,
    },
    {
      id: "workspace-boundary-score",
      guardFamily: "workspace",
      evidenceType: "score",
      description: `Workspace boundary score is ${guardAudit.workspaceBoundaryScore}.`,
      source: "enterprise-readiness-audit",
      persisted: false,
      writesToPrisma: false,
    },
    {
      id: "organization-boundary-score",
      guardFamily: "organization",
      evidenceType: "score",
      description: `Organization boundary score is ${guardAudit.organizationBoundaryScore}.`,
      source: "enterprise-readiness-audit",
      persisted: false,
      writesToPrisma: false,
    },
    {
      id: "shared-knowledge-write-block",
      guardFamily: "shared-knowledge",
      evidenceType: "constraint",
      description: "Shared knowledge writes and cross-workspace writes remain blocked.",
      source: "enterprise-readiness-audit",
      persisted: false,
      writesToPrisma: false,
    },
    {
      id: "cross-tenant-risk-score",
      guardFamily: "risk",
      evidenceType: "risk",
      description: `Cross-tenant risk score is ${guardAudit.crossTenantRiskScore}; lower is better.`,
      source: "enterprise-readiness-audit",
      persisted: false,
      writesToPrisma: false,
    },
  ]
}

export function evaluateEvidenceCoverage(
  evidence: GuardEvidenceItem[] = buildGuardEvidenceItems()
) {
  const expectedFamilies = ["tenant", "workspace", "organization", "shared-knowledge", "risk"]
  const covered = expectedFamilies.filter((family) =>
    evidence.some((item) => item.guardFamily === family)
  )
  const noPersistence = evidence.every((item) => !item.persisted && !item.writesToPrisma)

  return {
    score: Math.round(((covered.length / expectedFamilies.length) * 0.85 + (noPersistence ? 0.15 : 0)) * 100),
    status: "EVIDENCE_CONTRACT_READY_NOT_PERSISTED" as const,
    evidenceCount: evidence.length,
    coveredFamilies: covered,
    persistence: false,
  }
}

