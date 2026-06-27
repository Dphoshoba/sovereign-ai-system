import { buildEnterpriseTenantScope } from "./tenant-boundary"

export type TenantGuardMode = "report-only"

export type TenantGuardRule = {
  id: string
  name: string
  mode: TenantGuardMode
  requiredFields: string[]
  protectedCapabilities: string[]
  missingScopeBehavior: "block-future-execution"
  databaseWrites: false
}

export function buildTenantGuardRules(): TenantGuardRule[] {
  const scope = buildEnterpriseTenantScope()

  return [
    {
      id: "tenant-scope-required",
      name: "Tenant scope required",
      mode: "report-only",
      requiredFields: scope.requiredIdentifiers,
      protectedCapabilities: scope.blockedWithoutTenantScope,
      missingScopeBehavior: "block-future-execution",
      databaseWrites: false,
    },
    {
      id: "tenant-actor-required",
      name: "Actor identity required for enterprise operations",
      mode: "report-only",
      requiredFields: ["actorId", "organizationId"],
      protectedCapabilities: [
        "operator action execution",
        "review package decisions",
        "policy changes",
      ],
      missingScopeBehavior: "block-future-execution",
      databaseWrites: false,
    },
    {
      id: "tenant-workspace-required",
      name: "Workspace scope required for enterprise work",
      mode: "report-only",
      requiredFields: ["organizationId", "workspaceId"],
      protectedCapabilities: [
        "research mission execution",
        "content generation",
        "shared knowledge proposals",
      ],
      missingScopeBehavior: "block-future-execution",
      databaseWrites: false,
    },
  ]
}

export function evaluateTenantIsolation(rules: TenantGuardRule[] = buildTenantGuardRules()) {
  const reportOnly = rules.every((rule) => rule.mode === "report-only")
  const noDatabaseWrites = rules.every((rule) => rule.databaseWrites === false)
  const requiredFieldsCovered = new Set(
    rules.flatMap((rule) => rule.requiredFields)
  )
  const fieldScore = ["organizationId", "workspaceId", "actorId"].filter((field) =>
    requiredFieldsCovered.has(field)
  ).length
  const score = Math.round(
    ((fieldScore / 3) * 0.7 + (reportOnly ? 0.15 : 0) + (noDatabaseWrites ? 0.15 : 0)) *
      100
  )

  return {
    score,
    status: "REPORT_ONLY_GUARDS_DEFINED" as const,
    guardCount: rules.length,
    reportOnly,
    noDatabaseWrites,
    requiredFields: Array.from(requiredFieldsCovered),
  }
}

