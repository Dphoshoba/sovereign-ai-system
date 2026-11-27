export type ChangeApprovalGate = {
  id: string
  name: string
  appliesTo: string[]
  approvalMode: "review-required"
  canExecuteChange: false
}

export function buildChangeApprovalGates(): ChangeApprovalGate[] {
  return [
    {
      id: "policy-change-approval-gate",
      name: "Policy Change Approval Gate",
      appliesTo: ["policy lifecycle", "exceptions", "drift response"],
      approvalMode: "review-required",
      canExecuteChange: false,
    },
    {
      id: "deployment-change-approval-gate",
      name: "Deployment Change Approval Gate",
      appliesTo: ["release tier", "environment promotion", "production eligibility"],
      approvalMode: "review-required",
      canExecuteChange: false,
    },
  ]
}

export function evaluateChangeApprovalReadiness(
  gates: ChangeApprovalGate[] = buildChangeApprovalGates()
) {
  const allReviewRequired = gates.every((gate) => gate.approvalMode === "review-required")
  const noExecution = gates.every((gate) => gate.canExecuteChange === false)
  const allScoped = gates.every((gate) => gate.appliesTo.length > 0)
  const checks = [allReviewRequired, noExecution, allScoped]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "CHANGE_APPROVAL_GATES_PREVIEW_READY" as const,
    gateCount: gates.length,
    execution: false,
  }
}

