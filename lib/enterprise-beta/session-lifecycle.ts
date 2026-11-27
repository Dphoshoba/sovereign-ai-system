export type SessionLifecycleCheckpoint = {
  phase: "issue" | "refresh" | "revalidate" | "revoke" | "expire"
  requiresTenantScope: boolean
  requiresOperatorScope: boolean
  requiresAuditReference: boolean
  runtimeEnabled: false
}

export function buildSessionLifecyclePlan(): SessionLifecycleCheckpoint[] {
  return [
    {
      phase: "issue",
      requiresTenantScope: true,
      requiresOperatorScope: true,
      requiresAuditReference: true,
      runtimeEnabled: false,
    },
    {
      phase: "refresh",
      requiresTenantScope: true,
      requiresOperatorScope: true,
      requiresAuditReference: true,
      runtimeEnabled: false,
    },
    {
      phase: "revalidate",
      requiresTenantScope: true,
      requiresOperatorScope: true,
      requiresAuditReference: true,
      runtimeEnabled: false,
    },
    {
      phase: "revoke",
      requiresTenantScope: true,
      requiresOperatorScope: true,
      requiresAuditReference: true,
      runtimeEnabled: false,
    },
    {
      phase: "expire",
      requiresTenantScope: true,
      requiresOperatorScope: true,
      requiresAuditReference: false,
      runtimeEnabled: false,
    },
  ]
}
