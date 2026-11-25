import { buildCanaryCohorts } from "./canary-cohort"
import { buildOperatorApprovalGates } from "./operator-approval-gate"
import { buildRollbackSlaCheckpoints } from "./rollback-sla"

export type AuthCutoverScorecard = {
  id: string
  item:
    | "canary-success-threshold"
    | "rollback-sla-threshold"
    | "approval-gate-threshold"
    | "tenant-impact-threshold"
  required: boolean
  reportOnly: true
}

export function buildAuthCutoverScorecard(): AuthCutoverScorecard[] {
  return [
    {
      id: "scorecard-canary-success-threshold",
      item: "canary-success-threshold",
      required: true,
      reportOnly: true,
    },
    {
      id: "scorecard-rollback-sla-threshold",
      item: "rollback-sla-threshold",
      required: true,
      reportOnly: true,
    },
    {
      id: "scorecard-approval-gate-threshold",
      item: "approval-gate-threshold",
      required: true,
      reportOnly: true,
    },
    {
      id: "scorecard-tenant-impact-threshold",
      item: "tenant-impact-threshold",
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateAuthCutoverScorecardCoverage(
  scorecard: AuthCutoverScorecard[] = buildAuthCutoverScorecard()
) {
  const required = scorecard.filter((item) => item.required).length
  const canaries = buildCanaryCohorts()
  const slas = buildRollbackSlaCheckpoints()
  const approvals = buildOperatorApprovalGates()

  return {
    score: Math.round(
      (required / scorecard.length) * 45 +
        (canaries.filter((cohort) => cohort.required).length / canaries.length) * 15 +
        (slas.filter((sla) => sla.required).length / slas.length) * 15 +
        (approvals.filter((gate) => gate.required).length / approvals.length) * 15
    ),
    status: "AUTH_CUTOVER_SCORECARD_DEFINED_REPORT_ONLY" as const,
    itemCount: scorecard.length,
  }
}
