import {
  buildEnterpriseAlphaPhaseCompletion,
  evaluateEnterpriseAlphaCompletion,
} from "./enterprise-completion"
import {
  buildEnterpriseGapAnalysis,
  evaluateEnterpriseGaps,
} from "./enterprise-gap-analysis"
import { buildEnterpriseRiskReview, evaluateEnterpriseRisk } from "./enterprise-risk-review"

export type EnterpriseMergeReadinessItem = {
  id: string
  name: string
  status: "PASS" | "REVIEW_REQUIRED" | "BLOCKED"
  notes: string
}

export function buildEnterpriseMergeReadinessItems(): EnterpriseMergeReadinessItem[] {
  return [
    {
      id: "merge-build-smoke",
      name: "Build and smoke verification",
      status: "PASS",
      notes: "EA-7 verification passed; EA-8 must pass again before commit.",
    },
    {
      id: "merge-source-safety",
      name: "No runtime behavior changes",
      status: "PASS",
      notes: "Enterprise Alpha modules remain read-only planning and preview surfaces.",
    },
    {
      id: "merge-main-compatibility",
      name: "EV-KOS RC1 compatibility",
      status: "REVIEW_REQUIRED",
      notes: "Compatible by design, but broad documentation/module surface should receive final review.",
    },
    {
      id: "merge-beta-blockers",
      name: "Enterprise Beta blockers",
      status: "REVIEW_REQUIRED",
      notes: "Auth, guard enforcement, rate limiting, and audit persistence remain intentionally unimplemented.",
    },
  ]
}

export function evaluateEnterpriseMergeReadiness(
  items: EnterpriseMergeReadinessItem[] = buildEnterpriseMergeReadinessItems()
) {
  const completion = evaluateEnterpriseAlphaCompletion(buildEnterpriseAlphaPhaseCompletion())
  const gaps = evaluateEnterpriseGaps(buildEnterpriseGapAnalysis())
  const risk = evaluateEnterpriseRisk(buildEnterpriseRiskReview())
  const blocked = items.filter((item) => item.status === "BLOCKED").length
  const reviewRequired = items.filter((item) => item.status === "REVIEW_REQUIRED").length
  const mergeReadinessScore = Math.max(
    0,
    Math.round((completion.completionScore + gaps.score + (100 - risk.enterpriseRiskScore)) / 3) -
      blocked * 20 -
      reviewRequired * 2
  )

  return {
    mergeReadinessScore,
    status:
      blocked > 0
        ? "MERGE_BLOCKED" as const
        : "READY_FOR_HUMAN_MERGE_REVIEW" as const,
    blocked,
    reviewRequired,
    requiredReview: true,
  }
}
