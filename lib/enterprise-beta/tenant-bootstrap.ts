export type TenantBootstrapRequirement = {
  id: string
  title: string
  required: boolean
  category: "tenant-map" | "workspace-map" | "role-map" | "approval-map"
  reportOnly: true
}

export function buildTenantBootstrapRequirements(): TenantBootstrapRequirement[] {
  return [
    {
      id: "tenant-bootstrap-tenant-map",
      title: "Tenant to provider-subject mapping plan",
      required: true,
      category: "tenant-map",
      reportOnly: true,
    },
    {
      id: "tenant-bootstrap-workspace-map",
      title: "Workspace boundary mapping plan",
      required: true,
      category: "workspace-map",
      reportOnly: true,
    },
    {
      id: "tenant-bootstrap-role-map",
      title: "Role and entitlement mapping plan",
      required: true,
      category: "role-map",
      reportOnly: true,
    },
    {
      id: "tenant-bootstrap-approval-map",
      title: "Approval scope mapping plan",
      required: true,
      category: "approval-map",
      reportOnly: true,
    },
  ]
}
