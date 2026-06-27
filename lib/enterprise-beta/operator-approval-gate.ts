export type OperatorApprovalGate = {
  id: string
  gate:
    | "rehearsal-start-approval"
    | "canary-expansion-approval"
    | "rollback-trigger-approval"
    | "cutover-readiness-approval"
  required: boolean
  reportOnly: true
  runtimeActivation: false
}

export function buildOperatorApprovalGates(): OperatorApprovalGate[] {
  return [
    {
      id: "approval-gate-rehearsal-start",
      gate: "rehearsal-start-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "approval-gate-canary-expansion",
      gate: "canary-expansion-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "approval-gate-rollback-trigger",
      gate: "rollback-trigger-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "approval-gate-cutover-readiness",
      gate: "cutover-readiness-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
  ]
}

export function evaluateApprovalGateCoverage(
  gates: OperatorApprovalGate[] = buildOperatorApprovalGates()
) {
  const required = gates.filter((gate) => gate.required).length
  const reportOnly = gates.filter((gate) => gate.reportOnly).length

  return {
    score: Math.round((required / gates.length) * 60 + (reportOnly / gates.length) * 30),
    status: "APPROVAL_GATES_DEFINED_REPORT_ONLY" as const,
    gateCount: gates.length,
    runtimeActivation: false,
  }
}
