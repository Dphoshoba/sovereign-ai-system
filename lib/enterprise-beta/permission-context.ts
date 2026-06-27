import { buildExampleOperatorIdentity } from "./operator-identity"

export type PermissionContext = {
  actorId: string
  organizationId: string
  workspaceIds: string[]
  role: string
  permissions: string[]
  approvalScopes: string[]
  enforcementMode: "REPORT_ONLY"
  authorized: false
}

export function buildPermissionContext(): PermissionContext {
  const identity = buildExampleOperatorIdentity()

  return {
    actorId: identity.actorId,
    organizationId: identity.organizationId,
    workspaceIds: identity.workspaceIds,
    role: identity.role,
    permissions: identity.permissions,
    approvalScopes: identity.approvalScopes,
    enforcementMode: "REPORT_ONLY",
    authorized: false,
  }
}

export function summarizePermissionContext(context = buildPermissionContext()) {
  return {
    actorId: context.actorId,
    organizationId: context.organizationId,
    role: context.role,
    permissionCount: context.permissions.length,
    approvalScopeCount: context.approvalScopes.length,
    enforcementMode: context.enforcementMode,
    authorized: context.authorized,
  }
}
