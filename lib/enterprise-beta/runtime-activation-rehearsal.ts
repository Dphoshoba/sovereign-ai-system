export type RuntimeActivationRehearsalStep = {
  id: string
  step:
    | "define-tenant-canaries"
    | "define-approval-gates"
    | "define-rollback-sla"
    | "define-cutover-scorecard"
    | "define-fail-closed-criteria"
  required: boolean
  reportOnly: true
  runtimeActivation: false
}

export function buildRuntimeActivationRehearsalSteps(): RuntimeActivationRehearsalStep[] {
  return [
    {
      id: "rehearsal-define-tenant-canaries",
      step: "define-tenant-canaries",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "rehearsal-define-approval-gates",
      step: "define-approval-gates",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "rehearsal-define-rollback-sla",
      step: "define-rollback-sla",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "rehearsal-define-cutover-scorecard",
      step: "define-cutover-scorecard",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "rehearsal-define-fail-closed-criteria",
      step: "define-fail-closed-criteria",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
  ]
}

export function evaluateRehearsalCoverage(
  steps: RuntimeActivationRehearsalStep[] = buildRuntimeActivationRehearsalSteps()
) {
  const required = steps.filter((step) => step.required).length
  const reportOnly = steps.filter((step) => step.reportOnly).length

  return {
    score: Math.round((required / steps.length) * 70 + (reportOnly / steps.length) * 20),
    status: "RUNTIME_REHEARSAL_DEFINED_REPORT_ONLY" as const,
    stepCount: steps.length,
    runtimeActivation: false,
  }
}
