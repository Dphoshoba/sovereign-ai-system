export type SessionBootstrapCheckpoint = {
  id: string
  title: string
  required: boolean
  area: "token-shape" | "tenant-bind" | "operator-bind" | "revocation" | "observability"
  reportOnly: true
  runtimeEnabled: false
}

export function buildSessionBootstrapCheckpoints(): SessionBootstrapCheckpoint[] {
  return [
    {
      id: "session-bootstrap-token-shape",
      title: "Session token shape is documented",
      required: true,
      area: "token-shape",
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "session-bootstrap-tenant-bind",
      title: "Tenant/workspace binding checkpoint is defined",
      required: true,
      area: "tenant-bind",
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "session-bootstrap-operator-bind",
      title: "Operator identity binding checkpoint is defined",
      required: true,
      area: "operator-bind",
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "session-bootstrap-revocation",
      title: "Revocation and rollback checkpoint is defined",
      required: true,
      area: "revocation",
      reportOnly: true,
      runtimeEnabled: false,
    },
    {
      id: "session-bootstrap-observability",
      title: "Bootstrap observability checkpoint is defined",
      required: true,
      area: "observability",
      reportOnly: true,
      runtimeEnabled: false,
    },
  ]
}
