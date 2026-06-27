export type EnterpriseAuditEventDomain =
  | "tenant"
  | "workspace"
  | "organization"
  | "policy"
  | "guard"
  | "compliance"
  | "trust"

export type EnterpriseAuditEvent = {
  id: string
  domain: EnterpriseAuditEventDomain
  name: string
  severity: "info" | "warning" | "critical"
  evidenceRequired: string[]
  persistenceStatus: "not-persisted"
  executionImpact: "none"
}

export function buildEnterpriseAuditEventTaxonomy(): EnterpriseAuditEvent[] {
  return [
    {
      id: "tenant-scope-evaluated",
      domain: "tenant",
      name: "Tenant scope evaluated",
      severity: "info",
      evidenceRequired: ["organizationId contract", "workspaceId contract", "actorId contract"],
      persistenceStatus: "not-persisted",
      executionImpact: "none",
    },
    {
      id: "workspace-boundary-evaluated",
      domain: "workspace",
      name: "Workspace boundary evaluated",
      severity: "info",
      evidenceRequired: ["workspace guard rule", "write boundary", "shared knowledge constraint"],
      persistenceStatus: "not-persisted",
      executionImpact: "none",
    },
    {
      id: "organization-boundary-evaluated",
      domain: "organization",
      name: "Organization boundary evaluated",
      severity: "info",
      evidenceRequired: ["organization guard rule", "department scope", "team scope"],
      persistenceStatus: "not-persisted",
      executionImpact: "none",
    },
    {
      id: "policy-segregation-evaluated",
      domain: "policy",
      name: "Policy segregation evaluated",
      severity: "warning",
      evidenceRequired: ["policy domain", "cross-domain write status", "review requirement"],
      persistenceStatus: "not-persisted",
      executionImpact: "none",
    },
    {
      id: "cross-tenant-risk-evaluated",
      domain: "guard",
      name: "Cross-tenant leakage risk evaluated",
      severity: "warning",
      evidenceRequired: ["risk factors", "mitigations", "guard coverage"],
      persistenceStatus: "not-persisted",
      executionImpact: "none",
    },
    {
      id: "compliance-surface-evaluated",
      domain: "compliance",
      name: "Compliance surface evaluated",
      severity: "info",
      evidenceRequired: ["control family", "readiness status", "blocked capabilities"],
      persistenceStatus: "not-persisted",
      executionImpact: "none",
    },
  ]
}

export function evaluateAuditCoverage(
  events: EnterpriseAuditEvent[] = buildEnterpriseAuditEventTaxonomy()
) {
  const requiredDomains: EnterpriseAuditEventDomain[] = [
    "tenant",
    "workspace",
    "organization",
    "policy",
    "guard",
    "compliance",
  ]
  const covered = requiredDomains.filter((domain) =>
    events.some((event) => event.domain === domain)
  )
  const noPersistence = events.every((event) => event.persistenceStatus === "not-persisted")

  return {
    score: Math.round(((covered.length / requiredDomains.length) * 0.85 + (noPersistence ? 0.15 : 0)) * 100),
    status: "TAXONOMY_READY_NOT_PERSISTED" as const,
    eventCount: events.length,
    coveredDomains: covered,
    persistence: false,
  }
}

