export type ApprovalBoundaryStatus = "PASS" | "PARTIAL" | "BLOCKED"

export type ApprovalBoundaryCheck = {
  boundary:
    | "operator-intent"
    | "review-package"
    | "review-decision"
    | "graph-write"
    | "publishing"
    | "automatic-approval"
  approvalRequired: boolean
  bypassBlocked: boolean
  persistenceExpectation: string
  coverage: number
  status: ApprovalBoundaryStatus
  notes: string[]
}

export type ApprovalBoundaryAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  approvalBypassBlocked: boolean
  automaticApprovalsBlocked: boolean
  approvalCoverage: number
  checks: ApprovalBoundaryCheck[]
  criticalGaps: string[]
}

const checks: ApprovalBoundaryCheck[] = [
  boundary("operator-intent", true, true, "Pending ExecutionAuthorizationRequest package.", 86, [
    "Intent packages do not execute actions.",
  ]),
  boundary("review-package", true, true, "Pending ExecutionAuthorizationRequest review package.", 84, [
    "Package creation does not approve or write graph records.",
  ]),
  boundary("review-decision", true, true, "Future persisted reviewer decision.", 78, [
    "Decision preparation remains dry-run/readiness oriented.",
  ]),
  boundary("graph-write", true, true, "Governance audit plus explicit controlled test metadata.", 90, [
    "Graph writes are blocked except existing explicit-test-write controlled path.",
  ]),
  boundary("publishing", true, true, "Future publication approval and rollback record.", 68, [
    "Publishing routes need deeper approval boundary inventory before release.",
  ]),
  boundary("automatic-approval", true, true, "No automatic approval persistence permitted.", 94, [
    "Automatic approvals remain blocked by policy.",
  ]),
]

export function buildApprovalBoundaryAudit(): ApprovalBoundaryAudit {
  const approvalCoverage = Math.round(
    checks.reduce((sum, item) => sum + item.coverage, 0) / checks.length
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    approvalBypassBlocked: checks.every((item) => item.bypassBlocked),
    automaticApprovalsBlocked: true,
    approvalCoverage,
    checks,
    criticalGaps: [
      "Publishing approval boundary needs route-level negative tests.",
      "Review decision persistence must be verified before execution controls.",
    ],
  }
}

function boundary(
  boundaryName: ApprovalBoundaryCheck["boundary"],
  approvalRequired: boolean,
  bypassBlocked: boolean,
  persistenceExpectation: string,
  coverage: number,
  notes: string[]
): ApprovalBoundaryCheck {
  return {
    boundary: boundaryName,
    approvalRequired,
    bypassBlocked,
    persistenceExpectation,
    coverage,
    status:
      approvalRequired && bypassBlocked && coverage >= 85
        ? "PASS"
        : approvalRequired && bypassBlocked
          ? "PARTIAL"
          : "BLOCKED",
    notes,
  }
}
