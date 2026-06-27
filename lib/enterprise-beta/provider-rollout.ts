export type ProviderRolloutStage = {
  id: string
  stage:
    | "selection-freeze"
    | "sandbox-contract"
    | "claim-contract"
    | "tenant-pilot-plan"
    | "cutover-gate"
  required: boolean
  reportOnly: true
  runtimeEnabled: false
}

export function buildProviderRolloutStages(): ProviderRolloutStage[] {
  return [
    {
      id: "provider-rollout-selection-freeze",
      stage: "selection-freeze",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "provider-rollout-sandbox-contract",
      stage: "sandbox-contract",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "provider-rollout-claim-contract",
      stage: "claim-contract",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "provider-rollout-tenant-pilot-plan",
      stage: "tenant-pilot-plan",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "provider-rollout-cutover-gate",
      stage: "cutover-gate",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
  ]
}

export function evaluateRolloutCoverage(
  stages: ProviderRolloutStage[] = buildProviderRolloutStages()
) {
  const required = stages.filter((stage) => stage.required).length
  const reportOnly = stages.filter((stage) => stage.reportOnly).length

  return {
    score: Math.round((required / stages.length) * 70 + (reportOnly / stages.length) * 20),
    status: "PROVIDER_ROLLOUT_DEFINED_REPORT_ONLY" as const,
    stageCount: stages.length,
    runtimeEnabled: false,
  }
}
