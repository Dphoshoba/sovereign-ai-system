export type OperatorHoldpoint = {
  id: string
  holdpoint:
    | "wave-start-approval"
    | "telemetry-gate-approval"
    | "promotion-approval"
    | "rollback-drill-approval"
  required: boolean
  reportOnly: true
  runtimeActivation: false
}

export function buildOperatorHoldpoints(): OperatorHoldpoint[] {
  return [
    {
      id: "holdpoint-wave-start",
      holdpoint: "wave-start-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "holdpoint-telemetry-gate",
      holdpoint: "telemetry-gate-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "holdpoint-promotion",
      holdpoint: "promotion-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "holdpoint-rollback-drill",
      holdpoint: "rollback-drill-approval",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
  ]
}

export function evaluateHoldpointCoverage(
  holdpoints: OperatorHoldpoint[] = buildOperatorHoldpoints()
) {
  const required = holdpoints.filter((holdpoint) => holdpoint.required).length
  const reportOnly = holdpoints.filter((holdpoint) => holdpoint.reportOnly).length

  return {
    score: Math.round((required / holdpoints.length) * 60 + (reportOnly / holdpoints.length) * 30),
    status: "OPERATOR_HOLDPOINTS_DEFINED_REPORT_ONLY" as const,
    holdpointCount: holdpoints.length,
  }
}
