import { evaluateApprovalCoverage } from "./approval-chain"
import { evaluateChangeRequestCoverage } from "./policy-change-request"
import { evaluateImpactReadiness } from "./policy-impact-analysis"
import { evaluatePolicyReviewReadiness } from "./policy-review-board"
import { evaluatePolicyVersionReadiness } from "./policy-versioning"

export function buildChangeControlReadiness() {
  const changeRequests = evaluateChangeRequestCoverage()
  const reviewBoard = evaluatePolicyReviewReadiness()
  const versions = evaluatePolicyVersionReadiness()
  const approvals = evaluateApprovalCoverage()
  const impact = evaluateImpactReadiness()
  const score = Math.round(
    [changeRequests.score, reviewBoard.score, versions.score, approvals.score, impact.score].reduce(
      (sum, value) => sum + value,
      0
    ) / 5
  )

  return {
    score,
    status: "CHANGE_CONTROL_PREVIEW_READY" as const,
    changeRequests,
    reviewBoard,
    versions,
    approvals,
    impact,
    persistence: false,
    execution: false,
  }
}

