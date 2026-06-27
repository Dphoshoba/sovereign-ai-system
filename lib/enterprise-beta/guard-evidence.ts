import type { GuardDecision } from "./guard-decision"
import { buildGuardDecisions } from "./guard-decision"

export type GuardEvidenceItem = {
  id: string
  decisionId: string
  evidenceType:
    | "claim-check"
    | "permission-check"
    | "tenant-boundary"
    | "approval-boundary"
  summary: string
  present: boolean
  persisted: false
}

export function buildGuardEvidenceItems(
  decisions: GuardDecision[] = buildGuardDecisions()
): GuardEvidenceItem[] {
  return decisions.flatMap((decision) => [
    {
      id: `${decision.id}-claims`,
      decisionId: decision.id,
      evidenceType: "claim-check" as const,
      summary:
        decision.missingClaims.length === 0
          ? "All required claims are represented in the example context."
          : `Missing claims: ${decision.missingClaims.join(", ")}.`,
      present: decision.missingClaims.length === 0,
      persisted: false as const,
    },
    {
      id: `${decision.id}-permission`,
      decisionId: decision.id,
      evidenceType: "permission-check" as const,
      summary: `Required permissions: ${decision.requiredPermissions.join(", ")}.`,
      present: decision.requiredPermissions.length > 0,
      persisted: false as const,
    },
  ])
}

export function evaluateEvidenceCoverage(
  evidence: GuardEvidenceItem[] = buildGuardEvidenceItems()
) {
  const present = evidence.filter((item) => item.present).length

  return {
    score: Math.round((present / evidence.length) * 82),
    status: "EVIDENCE_MODELED_NOT_PERSISTED" as const,
    evidenceCount: evidence.length,
    persisted: false,
  }
}
