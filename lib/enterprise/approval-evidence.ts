import { buildGuardEvidencePacket } from "./guard-evidence-packet"

export type ApprovalEvidenceItem = {
  id: string
  evidenceFamily: "audit" | "guard" | "lineage" | "tenant" | "policy" | "risk"
  description: string
  source: string
  requiredForDecision: boolean
  persisted: false
}

export function buildApprovalEvidenceItems(): ApprovalEvidenceItem[] {
  const guardPacket = buildGuardEvidencePacket()

  return [
    {
      id: "audit-coverage-evidence",
      evidenceFamily: "audit",
      description: `Audit coverage is ${guardPacket.auditCoverage.score}.`,
      source: "guard-evidence-packet",
      requiredForDecision: true,
      persisted: false,
    },
    {
      id: "guard-evidence-readiness",
      evidenceFamily: "guard",
      description: `Evidence coverage is ${guardPacket.evidenceCoverage.score}.`,
      source: "guard-evidence-packet",
      requiredForDecision: true,
      persisted: false,
    },
    {
      id: "tenant-boundary-evidence",
      evidenceFamily: "tenant",
      description: "Organization, workspace, and actor scope are required by contract.",
      source: "tenant-guard",
      requiredForDecision: true,
      persisted: false,
    },
    {
      id: "policy-segregation-evidence",
      evidenceFamily: "policy",
      description: "Policy domains are segregated and cross-domain writes are blocked.",
      source: "policy-isolation",
      requiredForDecision: true,
      persisted: false,
    },
    {
      id: "cross-tenant-risk-evidence",
      evidenceFamily: "risk",
      description: "Cross-tenant leakage risk is scored before future execution.",
      source: "cross-tenant-risk",
      requiredForDecision: true,
      persisted: false,
    },
  ]
}

export function evaluateApprovalEvidenceCoverage(
  evidence: ApprovalEvidenceItem[] = buildApprovalEvidenceItems()
) {
  const requiredFamilies: ApprovalEvidenceItem["evidenceFamily"][] = [
    "audit",
    "guard",
    "tenant",
    "policy",
    "risk",
  ]
  const covered = requiredFamilies.filter((family) =>
    evidence.some((item) => item.evidenceFamily === family)
  )
  const allRequired = evidence.every((item) => item.requiredForDecision)
  const noPersistence = evidence.every((item) => item.persisted === false)

  return {
    score: Math.round(
      ((covered.length / requiredFamilies.length) * 0.8 +
        (allRequired ? 0.1 : 0) +
        (noPersistence ? 0.1 : 0)) *
        100
    ),
    status: "APPROVAL_EVIDENCE_PREVIEW_READY" as const,
    evidenceCount: evidence.length,
    coveredFamilies: covered,
    persistence: false,
  }
}

