import { buildApprovalBoundaryAudit } from "./approval-boundary-audit"
import { buildExecutionBarrierAudit } from "./execution-barrier-audit"
import { buildNegativeTestSuite } from "./negative-test-suite"

export type GuardrailTestSummary = {
  ok: true
  readOnly: true
  writesToPrisma: false
  executionBlocked: boolean
  publishingBlocked: boolean
  graphWritesBlocked: boolean
  socialPostingBlocked: boolean
  approvalBypassBlocked: boolean
  openAiBlocked: boolean
  automaticApprovalsBlocked: boolean
  guardCoverage: number
  negativeTestCoverage: number
  passedContracts: number
  totalContracts: number
  gaps: string[]
}

export function buildGuardrailTestSummary(): GuardrailTestSummary {
  const execution = buildExecutionBarrierAudit()
  const approvals = buildApprovalBoundaryAudit()
  const negativeTests = buildNegativeTestSuite()
  const passedContracts = negativeTests.tests.filter(
    (test) => test.status === "PASS"
  ).length
  const totalContracts = negativeTests.tests.length
  const guardCoverage = Math.round(
    [execution.guardCoverage, approvals.approvalCoverage].reduce(
      (sum, score) => sum + score,
      0
    ) / 2
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    executionBlocked: execution.executionBlocked,
    publishingBlocked: execution.publishingBlocked,
    graphWritesBlocked: execution.graphWritesBlocked,
    socialPostingBlocked: execution.socialPostingBlocked,
    approvalBypassBlocked: approvals.approvalBypassBlocked,
    openAiBlocked: execution.openAiBlocked,
    automaticApprovalsBlocked: approvals.automaticApprovalsBlocked,
    guardCoverage,
    negativeTestCoverage: negativeTests.negativeTestCoverage,
    passedContracts,
    totalContracts,
    gaps: [...execution.blockers, ...approvals.criticalGaps, ...negativeTests.gaps],
  }
}
