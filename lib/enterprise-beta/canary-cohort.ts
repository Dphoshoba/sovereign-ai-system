export type CanaryCohort = {
  id: string
  cohort: "internal-operators" | "single-tenant-pilot" | "low-risk-tenant-batch"
  tenantScoped: true
  required: boolean
  reportOnly: true
}

export function buildCanaryCohorts(): CanaryCohort[] {
  return [
    {
      id: "canary-internal-operators",
      cohort: "internal-operators",
      tenantScoped: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "canary-single-tenant-pilot",
      cohort: "single-tenant-pilot",
      tenantScoped: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "canary-low-risk-tenant-batch",
      cohort: "low-risk-tenant-batch",
      tenantScoped: true,
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluateCanaryCoverage(
  cohorts: CanaryCohort[] = buildCanaryCohorts()
) {
  const required = cohorts.filter((cohort) => cohort.required).length
  const tenantScoped = cohorts.filter((cohort) => cohort.tenantScoped).length

  return {
    score: Math.round(
      (required / cohorts.length) * 50 + (tenantScoped / cohorts.length) * 40
    ),
    status: "CANARY_COHORTS_DEFINED_REPORT_ONLY" as const,
    cohortCount: cohorts.length,
  }
}
