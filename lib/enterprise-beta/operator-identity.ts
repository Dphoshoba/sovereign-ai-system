export type OperatorIdentityContract = {
  actorId: string
  displayName: string
  organizationId: string
  workspaceIds: string[]
  role: "viewer" | "reviewer" | "operator" | "publisher" | "administrator"
  permissions: string[]
  approvalScopes: string[]
  runtimeValidated: false
}

export function buildExampleOperatorIdentity(): OperatorIdentityContract {
  return {
    actorId: "operator-preview-001",
    displayName: "Enterprise Beta Preview Operator",
    organizationId: "org-preview",
    workspaceIds: ["workspace-research", "workspace-executive"],
    role: "administrator",
    permissions: [
      "view-enterprise-readiness",
      "preview-identity-contract",
      "preview-guard-coverage",
    ],
    approvalScopes: ["identity-planning", "enterprise-beta-review"],
    runtimeValidated: false,
  }
}

export function summarizeOperatorIdentity(identity = buildExampleOperatorIdentity()) {
  return {
    actorId: identity.actorId,
    organizationId: identity.organizationId,
    workspaceCount: identity.workspaceIds.length,
    role: identity.role,
    permissionCount: identity.permissions.length,
    runtimeValidated: identity.runtimeValidated,
  }
}
