import { NextResponse } from "next/server"

import { buildApprovalBoundaryAudit } from "../../../../lib/release/approval-boundary-audit"
import { buildExecutionBarrierAudit } from "../../../../lib/release/execution-barrier-audit"
import { buildGuardrailTestSummary } from "../../../../lib/release/guardrail-tests"
import { buildNegativeTestSuite } from "../../../../lib/release/negative-test-suite"
import { buildStartupGate } from "../../../../lib/release/startup-gate"

export async function GET() {
  const execution = buildExecutionBarrierAudit()
  const approvals = buildApprovalBoundaryAudit()
  const guardrails = buildGuardrailTestSummary()
  const negativeTests = buildNegativeTestSuite()
  const startupGate = buildStartupGate()
  const releaseReadinessScore = Math.round(
    [
      guardrails.guardCoverage,
      negativeTests.negativeTestCoverage,
      startupGate.score,
      approvals.approvalCoverage,
    ].reduce((sum, score) => sum + score, 0) / 4
  )
  const criticalBlockers = [
    "Auth, authorization, and rate-limit contracts are not yet enforced at route boundaries.",
    "Publishing and social posting routes need live negative tests before release controls.",
    "Observability and audit contracts are not yet persisted to a telemetry backend.",
  ]

  return NextResponse.json({
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    releaseReadinessScore,
    guardCoverage: guardrails.guardCoverage,
    negativeTestCoverage: negativeTests.negativeTestCoverage,
    startupGateStatus: startupGate.startupGateStatus,
    releaseCandidateStatus:
      releaseReadinessScore >= 90 && criticalBlockers.length === 0
        ? "READY_FOR_RELEASE"
        : releaseReadinessScore >= 84
          ? "READY_FOR_RC5"
          : "PARTIAL",
    criticalBlockers,
    recommendedActions: [
      "Convert RC-4 negative-test contracts into automated HTTP tests in RC-5.",
      "Add auth, authorization, and rate-limit enforcement plans without enabling execution.",
      "Add publishing/social route negative tests before exposing any operator controls.",
      "Plan persistent observability transport for audit and release confidence snapshots.",
    ],
    safetyFlags: {
      executionBlocked: guardrails.executionBlocked,
      publishingBlocked: guardrails.publishingBlocked,
      graphWritesBlocked: guardrails.graphWritesBlocked,
      graphDeletesBlocked: execution.graphDeletesBlocked,
      socialPostingBlocked: guardrails.socialPostingBlocked,
      approvalBypassBlocked: guardrails.approvalBypassBlocked,
      openAiBlocked: guardrails.openAiBlocked,
      automaticApprovalsBlocked: guardrails.automaticApprovalsBlocked,
      startupGateReady: startupGate.startupGateReady,
      writesToPrisma: false,
      graphWrites: false,
      graphDeletes: false,
      publishing: false,
      socialPosting: false,
      openAiCalls: false,
      execution: false,
      automaticApprovals: false,
    },
    audits: {
      execution,
      approvals,
      guardrails,
      negativeTests,
      startupGate,
    },
  })
}
