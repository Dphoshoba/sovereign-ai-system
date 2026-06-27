import { buildTenantRollbackCheckpoints } from "./tenant-rollback-checkpoints"

export type AuthRollbackControl = {
  id: string
  control: "tenant-scoped-disable" | "feature-flag-revert" | "claim-fallback" | "operator-escalation"
  required: boolean
  reportOnly: true
  runtimeEnabled: false
}

export function buildAuthRollbackControls(): AuthRollbackControl[] {
  return [
    {
      id: "auth-rollback-tenant-scoped-disable",
      control: "tenant-scoped-disable",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "auth-rollback-feature-flag-revert",
      control: "feature-flag-revert",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "auth-rollback-claim-fallback",
      control: "claim-fallback",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "auth-rollback-operator-escalation",
      control: "operator-escalation",
      required: true,
      reportOnly: true,
      runtimeEnabled: false,
    },
  ]
}

export function evaluateRollbackCoverage(
  controls: AuthRollbackControl[] = buildAuthRollbackControls()
) {
  const required = controls.filter((control) => control.required).length
  const tenantCheckpoints = buildTenantRollbackCheckpoints()
  const tenantRequired = tenantCheckpoints.filter((checkpoint) => checkpoint.required).length

  return {
    score: Math.round(
      (required / controls.length) * 60 + (tenantRequired / tenantCheckpoints.length) * 30
    ),
    status: "AUTH_ROLLBACK_DEFINED_REPORT_ONLY" as const,
    controlCount: controls.length,
    runtimeEnabled: false,
  }
}
