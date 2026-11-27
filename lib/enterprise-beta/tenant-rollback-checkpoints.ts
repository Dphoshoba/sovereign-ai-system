export type TenantRollbackCheckpoint = {
  id: string
  title: string
  scope: "organization" | "workspace" | "operator"
  required: boolean
  reportOnly: true
}

export function buildTenantRollbackCheckpoints(): TenantRollbackCheckpoint[] {
  return [
    {
      id: "tenant-rollback-organization-gate",
      title: "Organization-level rollback gate is defined",
      scope: "organization",
      required: true,
      reportOnly: true,
    },
    {
      id: "tenant-rollback-workspace-gate",
      title: "Workspace-level rollback gate is defined",
      scope: "workspace",
      required: true,
      reportOnly: true,
    },
    {
      id: "tenant-rollback-operator-gate",
      title: "Operator-level rollback accountability gate is defined",
      scope: "operator",
      required: true,
      reportOnly: true,
    },
  ]
}
