import { buildApprovalChains, evaluateApprovalCoverage } from "./approval-chain"
import {
  buildApprovalDelegationRules,
  evaluateDelegationCoverage,
} from "./approval-delegation"
import {
  buildApprovalEvidenceItems,
  evaluateApprovalEvidenceCoverage,
} from "./approval-evidence"
import { buildEnterpriseDecisionPackets, evaluateDecisionExplainability } from "./decision-packet"
import { buildGovernanceBoardReadiness } from "./governance-board"
import { buildReviewBoard, evaluateReviewCoverage } from "./review-board"
import { buildReviewWorkflowSteps, evaluateWorkflowReadiness } from "./review-workflow"

export function buildEnterpriseApprovalReadiness() {
  const reviewBoard = buildReviewBoard()
  const approvalChains = buildApprovalChains()
  const delegationRules = buildApprovalDelegationRules()
  const approvalEvidence = buildApprovalEvidenceItems()
  const workflowSteps = buildReviewWorkflowSteps()
  const decisionPackets = buildEnterpriseDecisionPackets()

  const approvalCoverage = evaluateApprovalCoverage(approvalChains)
  const reviewCoverage = evaluateReviewCoverage(reviewBoard)
  const delegationCoverage = evaluateDelegationCoverage(delegationRules)
  const evidenceCoverage = evaluateApprovalEvidenceCoverage(approvalEvidence)
  const workflowReadiness = evaluateWorkflowReadiness(workflowSteps)
  const decisionExplainability = evaluateDecisionExplainability(decisionPackets)
  const governanceBoard = buildGovernanceBoardReadiness()
  const governanceScore = governanceBoard.governanceReadiness.score
  const decisionScore = decisionExplainability.score
  const enterpriseGovernanceScore = Math.round(
    [
      approvalCoverage.score,
      reviewCoverage.score,
      delegationCoverage.score,
      evidenceCoverage.score,
      workflowReadiness.score,
      governanceScore,
      decisionScore,
    ].reduce((sum, score) => sum + score, 0) / 7
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    persistence: false,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    providerInstallation: false,
    telemetryBackend: false,
    sessions: false,
    jwt: false,
    approvalReadiness: approvalCoverage.score,
    reviewBoardReadiness: reviewCoverage.score,
    delegationReadiness: delegationCoverage.score,
    governanceScore,
    decisionScore,
    enterpriseGovernanceScore,
    approvalCoverage: approvalCoverage.score,
    reviewCoverage: reviewCoverage.score,
    delegationCoverage: delegationCoverage.score,
    workflowReadiness: workflowReadiness.score,
    governanceReadiness: governanceScore,
    decisionExplainability: decisionScore,
    recommendedEA6:
      "EA-6 should define enterprise policy change-control and exception review in preview mode without persistence or execution.",
    reviewBoard,
    approvalChains,
    delegationRules,
    approvalEvidence,
    workflowSteps,
    decisionPackets,
    governanceBoard,
  }
}

