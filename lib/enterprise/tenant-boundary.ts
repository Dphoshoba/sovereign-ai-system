export type EnterpriseTenantScope = {
  organizationRequired: true
  workspaceRequired: true
  actorRequired: true
  tenantIsolationStatus: "contract-defined-not-enforced"
  requiredIdentifiers: Array<"organizationId" | "workspaceId" | "actorId">
  blockedWithoutTenantScope: string[]
}

export type EnterpriseDataBoundary = {
  area: string
  classification: "public" | "internal" | "confidential" | "restricted"
  tenantScoped: boolean
  exportAllowed: boolean
  retentionPolicy: "not-defined" | "contract-required"
  notes: string
}

export function buildEnterpriseTenantScope(): EnterpriseTenantScope {
  return {
    organizationRequired: true,
    workspaceRequired: true,
    actorRequired: true,
    tenantIsolationStatus: "contract-defined-not-enforced",
    requiredIdentifiers: ["organizationId", "workspaceId", "actorId"],
    blockedWithoutTenantScope: [
      "operator action execution",
      "graph writes",
      "publishing",
      "social posting",
      "review package execution",
      "content generation",
      "external connector execution",
    ],
  }
}

export function buildEnterpriseDataBoundaries(): EnterpriseDataBoundary[] {
  return [
    {
      area: "research evidence",
      classification: "confidential",
      tenantScoped: true,
      exportAllowed: false,
      retentionPolicy: "contract-required",
      notes: "Evidence and citations must remain bound to source, mission, organization, and workspace context.",
    },
    {
      area: "semantic graph",
      classification: "restricted",
      tenantScoped: true,
      exportAllowed: false,
      retentionPolicy: "contract-required",
      notes: "Graph writes remain blocked except existing explicit test-write controls.",
    },
    {
      area: "operator intent",
      classification: "restricted",
      tenantScoped: true,
      exportAllowed: false,
      retentionPolicy: "contract-required",
      notes: "Intent packages are audit artifacts only and must not execute actions.",
    },
    {
      area: "campaign previews",
      classification: "confidential",
      tenantScoped: true,
      exportAllowed: false,
      retentionPolicy: "contract-required",
      notes: "Preview packets contain no generated outbound content in Enterprise Alpha.",
    },
    {
      area: "release readiness",
      classification: "internal",
      tenantScoped: false,
      exportAllowed: true,
      retentionPolicy: "not-defined",
      notes: "Readiness reports are contract and audit summaries only.",
    },
  ]
}

