export type IdentityCheckpoint = {
  id: string
  title: string
  area: "provider-selection" | "tenant-scope" | "operator-scope" | "claims" | "audit-link"
  required: boolean
  complete: boolean
}

export function buildIdentityCheckpoints(): IdentityCheckpoint[] {
  return [
    {
      id: "identity-check-provider-selection",
      title: "Provider selection criteria are documented",
      area: "provider-selection",
      required: true,
      complete: true,
    },
    {
      id: "identity-check-tenant-scope",
      title: "Tenant boundary and workspace boundary claims are mapped",
      area: "tenant-scope",
      required: true,
      complete: true,
    },
    {
      id: "identity-check-operator-scope",
      title: "Operator identity and accountability fields are mapped",
      area: "operator-scope",
      required: true,
      complete: true,
    },
    {
      id: "identity-check-claims",
      title: "Claims readiness is reportable without JWT/session issuance",
      area: "claims",
      required: true,
      complete: true,
    },
    {
      id: "identity-check-audit-link",
      title: "Identity checkpoints can link to audit persistence design",
      area: "audit-link",
      required: true,
      complete: true,
    },
  ]
}

export function evaluateIdentityCoverage(
  checkpoints: IdentityCheckpoint[] = buildIdentityCheckpoints()
) {
  const completeRequired = checkpoints.filter(
    (checkpoint) => checkpoint.required && checkpoint.complete
  ).length

  return {
    score: Math.round((completeRequired / checkpoints.length) * 90),
    status: "IDENTITY_CHECKPOINTS_DEFINED_REPORT_ONLY" as const,
    checkpointCount: checkpoints.length,
  }
}
