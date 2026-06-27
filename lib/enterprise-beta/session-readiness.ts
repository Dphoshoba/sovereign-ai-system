import { buildOperatorSessionCheckpoints } from "./operator-session"
import { buildSessionGovernanceControls } from "./session-governance"
import { buildSessionLifecyclePlan } from "./session-lifecycle"
import { buildTenantSessionModel } from "./tenant-session-model"

export function evaluateSessionCoverage() {
  const lifecycle = buildSessionLifecyclePlan()
  const tenantModel = buildTenantSessionModel()
  const operatorCheckpoints = buildOperatorSessionCheckpoints()
  const governanceControls = buildSessionGovernanceControls()

  const lifecycleScoped = lifecycle.filter(
    (step) => step.requiresTenantScope && step.requiresOperatorScope
  ).length
  const requiredTenantFields = tenantModel.filter((field) => field.required).length
  const requiredOperator = operatorCheckpoints.filter(
    (checkpoint) => checkpoint.required
  ).length
  const requiredGovernance = governanceControls.filter(
    (control) => control.required
  ).length

  const score = Math.round(
    (lifecycleScoped / lifecycle.length) * 25 +
      (requiredTenantFields / tenantModel.length) * 25 +
      (requiredOperator / operatorCheckpoints.length) * 25 +
      (requiredGovernance / governanceControls.length) * 25
  )

  return {
    score,
    status: "SESSION_CHECKPOINTS_DEFINED_REPORT_ONLY" as const,
    sessionsEnabled: false,
    jwtIssued: false,
    lifecycle,
    tenantModel,
    operatorCheckpoints,
    governanceControls,
  }
}
