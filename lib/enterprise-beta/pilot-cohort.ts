export type PilotCohort = {
  id: string
  cohort: "internal-tenant" | "single-enterprise-tenant" | "low-risk-tenant-cluster"
  tenantLimited: true
  required: boolean
  reportOnly: true
}

export function buildPilotCohorts(): PilotCohort[] {
  return [
    {
      id: "pilot-cohort-internal-tenant",
      cohort: "internal-tenant",
      tenantLimited: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "pilot-cohort-single-enterprise-tenant",
      cohort: "single-enterprise-tenant",
      tenantLimited: true,
      required: true,
      reportOnly: true,
    },
    {
      id: "pilot-cohort-low-risk-tenant-cluster",
      cohort: "low-risk-tenant-cluster",
      tenantLimited: true,
      required: true,
      reportOnly: true,
    },
  ]
}

export function evaluatePilotCoverage(cohorts: PilotCohort[] = buildPilotCohorts()) {
  const required = cohorts.filter((cohort) => cohort.required).length
  const tenantLimited = cohorts.filter((cohort) => cohort.tenantLimited).length

  return {
    score: Math.round((required / cohorts.length) * 50 + (tenantLimited / cohorts.length) * 40),
    status: "PILOT_COHORTS_DEFINED_REPORT_ONLY" as const,
    cohortCount: cohorts.length,
  }
}
