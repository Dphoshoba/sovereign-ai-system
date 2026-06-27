export type RedactionPolicy = {
  id: string
  fieldClass:
    | "actor-identifier"
    | "tenant-identifier"
    | "workspace-identifier"
    | "freeform-reason"
    | "security-signal"
  redactionMode: "HASH" | "MASK" | "RETAIN_WITH_ACCESS_CONTROL"
  operatorVisible: boolean
  complianceVisible: boolean
  active: false
}

export function buildAuditRedactionPolicies(): RedactionPolicy[] {
  return [
    {
      id: "redact-actor",
      fieldClass: "actor-identifier",
      redactionMode: "HASH",
      operatorVisible: false,
      complianceVisible: true,
      active: false,
    },
    {
      id: "redact-tenant",
      fieldClass: "tenant-identifier",
      redactionMode: "RETAIN_WITH_ACCESS_CONTROL",
      operatorVisible: true,
      complianceVisible: true,
      active: false,
    },
    {
      id: "redact-workspace",
      fieldClass: "workspace-identifier",
      redactionMode: "MASK",
      operatorVisible: true,
      complianceVisible: true,
      active: false,
    },
    {
      id: "redact-freeform",
      fieldClass: "freeform-reason",
      redactionMode: "MASK",
      operatorVisible: true,
      complianceVisible: true,
      active: false,
    },
  ]
}

export function evaluateRedactionCoverage(
  policies: RedactionPolicy[] = buildAuditRedactionPolicies()
) {
  const protectedPolicies = policies.filter(
    (policy) => policy.redactionMode !== "RETAIN_WITH_ACCESS_CONTROL"
  ).length

  return {
    score: Math.round((protectedPolicies / policies.length) * 70 + 18),
    status: "REDACTION_POLICY_DEFINED_NOT_ACTIVE" as const,
    policyCount: policies.length,
    active: false,
  }
}
