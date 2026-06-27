export type RuntimeAuthDryRunStep = {
  id: string
  step:
    | "scope-freeze"
    | "shadow-auth-evaluation"
    | "feature-flag-simulation"
    | "tenant-rollback-simulation"
    | "go-no-go-review"
  required: boolean
  reportOnly: true
  runtimeActivation: false
}

export function buildRuntimeAuthDryRunPlan(): RuntimeAuthDryRunStep[] {
  return [
    {
      id: "dry-run-scope-freeze",
      step: "scope-freeze",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "dry-run-shadow-auth-evaluation",
      step: "shadow-auth-evaluation",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "dry-run-feature-flag-simulation",
      step: "feature-flag-simulation",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "dry-run-tenant-rollback-simulation",
      step: "tenant-rollback-simulation",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
    {
      id: "dry-run-go-no-go-review",
      step: "go-no-go-review",
      required: true,
      reportOnly: true,
      runtimeActivation: false,
    },
  ]
}

export function evaluateDryRunCoverage(
  steps: RuntimeAuthDryRunStep[] = buildRuntimeAuthDryRunPlan()
) {
  const required = steps.filter((step) => step.required).length
  const reportOnly = steps.filter((step) => step.reportOnly).length

  return {
    score: Math.round((required / steps.length) * 70 + (reportOnly / steps.length) * 20),
    status: "RUNTIME_AUTH_DRY_RUN_DEFINED_REPORT_ONLY" as const,
    stepCount: steps.length,
    runtimeActivation: false,
  }
}
