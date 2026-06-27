import { evaluateApprovalCoverage } from "./approval-chain"
import { evaluateDelegationCoverage } from "./approval-delegation"
import { evaluateDecisionExplainability } from "./decision-packet"
import { evaluateReviewCoverage } from "./review-board"
import { evaluateWorkflowReadiness } from "./review-workflow"

export function buildGovernanceBoardReadiness() {
  const approvalCoverage = evaluateApprovalCoverage()
  const reviewCoverage = evaluateReviewCoverage()
  const delegationCoverage = evaluateDelegationCoverage()
  const workflowReadiness = evaluateWorkflowReadiness()
  const decisionExplainability = evaluateDecisionExplainability()
  const governanceReadiness = Math.round(
    [
      approvalCoverage.score,
      reviewCoverage.score,
      delegationCoverage.score,
      workflowReadiness.score,
      decisionExplainability.score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )

  return {
    approvalCoverage,
    reviewCoverage,
    delegationCoverage,
    workflowReadiness,
    governanceReadiness: {
      score: governanceReadiness,
      status: "GOVERNANCE_BOARD_PREVIEW_READY" as const,
    },
    decisionExplainability,
  }
}

