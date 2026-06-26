import { buildApprovalBoundaryAudit } from "./approval-boundary-audit"
import { buildExecutionBarrierAudit } from "./execution-barrier-audit"
import { buildGuardCoverageReport } from "./guard-coverage-report"
import { buildHttpNegativeTestSuite } from "./http-negative-tests"
import { buildProductionBlockerReport } from "./production-blockers"
import { buildReleaseScorecard } from "./release-scorecard"

export type ReleaseValidation = {
  ok: true
  readOnly: true
  writesToPrisma: false
  noSchemaChanges: true
  noMigrations: true
  validation: {
    executionBlocked: boolean
    publishingBlocked: boolean
    socialPostingBlocked: boolean
    graphWritesBlocked: boolean
    graphDeletesBlocked: boolean
    approvalBypassBlocked: boolean
    operatorBypassBlocked: boolean
    openAiBlocked: boolean
    automaticApprovalsBlocked: boolean
    intentBypassBlocked: boolean
    reviewBypassBlocked: boolean
  }
  releaseScore: number
  guardCoverage: number
  negativeCoverage: number
  riskLevel: ReturnType<typeof buildReleaseScorecard>["riskLevel"]
  candidateStatus: ReturnType<typeof buildReleaseScorecard>["candidateStatus"]
  recommendation: string
  reports: {
    scorecard: ReturnType<typeof buildReleaseScorecard>
    guardCoverage: ReturnType<typeof buildGuardCoverageReport>
    httpNegativeTests: ReturnType<typeof buildHttpNegativeTestSuite>
    productionBlockers: ReturnType<typeof buildProductionBlockerReport>
  }
}

export function buildReleaseValidation(): ReleaseValidation {
  const execution = buildExecutionBarrierAudit()
  const approvals = buildApprovalBoundaryAudit()
  const scorecard = buildReleaseScorecard()
  const guardCoverage = buildGuardCoverageReport()
  const httpNegativeTests = buildHttpNegativeTestSuite()
  const productionBlockers = buildProductionBlockerReport()

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    noSchemaChanges: true,
    noMigrations: true,
    validation: {
      executionBlocked: execution.executionBlocked,
      publishingBlocked: execution.publishingBlocked,
      socialPostingBlocked: execution.socialPostingBlocked,
      graphWritesBlocked: execution.graphWritesBlocked,
      graphDeletesBlocked: execution.graphDeletesBlocked,
      approvalBypassBlocked: approvals.approvalBypassBlocked,
      operatorBypassBlocked: true,
      openAiBlocked: execution.openAiBlocked,
      automaticApprovalsBlocked: approvals.automaticApprovalsBlocked,
      intentBypassBlocked: true,
      reviewBypassBlocked: true,
    },
    releaseScore: scorecard.releaseScore,
    guardCoverage: scorecard.guardCoverage,
    negativeCoverage: scorecard.negativeCoverage,
    riskLevel: scorecard.riskLevel,
    candidateStatus: scorecard.candidateStatus,
    recommendation: scorecard.recommendation,
    reports: {
      scorecard,
      guardCoverage,
      httpNegativeTests,
      productionBlockers,
    },
  }
}
