export type TenantSessionField = {
  key:
    | "organizationId"
    | "workspaceId"
    | "environment"
    | "membershipRole"
    | "entitlementTier"
    | "actorId"
  required: boolean
  source: "future-provider-claim" | "runtime-context"
  notes: string
}

export function buildTenantSessionModel(): TenantSessionField[] {
  return [
    {
      key: "organizationId",
      required: true,
      source: "future-provider-claim",
      notes: "Primary tenant boundary for every enterprise action.",
    },
    {
      key: "workspaceId",
      required: true,
      source: "future-provider-claim",
      notes: "Workspace-level boundary to prevent cross-workspace access.",
    },
    {
      key: "environment",
      required: true,
      source: "runtime-context",
      notes: "Supports production/staging separation at the authorization layer.",
    },
    {
      key: "membershipRole",
      required: true,
      source: "future-provider-claim",
      notes: "Role scoping for route and action checkpoints.",
    },
    {
      key: "entitlementTier",
      required: true,
      source: "future-provider-claim",
      notes: "Feature gating input for enterprise and operator workflows.",
    },
    {
      key: "actorId",
      required: true,
      source: "future-provider-claim",
      notes: "Ties every session context to accountable operator identity.",
    },
  ]
}
