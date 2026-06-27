export type SessionGovernanceControl = {
  id: string
  title: string
  required: boolean
  enforcementMode: "REPORT_ONLY"
  active: false
}

export function buildSessionGovernanceControls(): SessionGovernanceControl[] {
  return [
    {
      id: "session-governance-max-duration",
      title: "Maximum session lifetime policy",
      required: true,
      enforcementMode: "REPORT_ONLY",
      active: false,
    },
    {
      id: "session-governance-tenant-rotation",
      title: "Tenant context rotation and invalidation policy",
      required: true,
      enforcementMode: "REPORT_ONLY",
      active: false,
    },
    {
      id: "session-governance-operator-reauth",
      title: "Operator re-auth checkpoint for elevated actions",
      required: true,
      enforcementMode: "REPORT_ONLY",
      active: false,
    },
    {
      id: "session-governance-audit-linkage",
      title: "Session governance linkage to audit persistence controls",
      required: true,
      enforcementMode: "REPORT_ONLY",
      active: false,
    },
  ]
}
