import type { OperatorPermission } from "./operator-permissions"
import { getOperatorRole, roleHasPermission, type OperatorRole } from "./operator-roles"

export type OperatorIdentity = {
  actorId: string
  role: OperatorRole
  organizationId?: string
  workspaceId?: string
  permissions?: OperatorPermission[]
  source: "contract-preview" | "future-provider"
}

export type OperatorAuthValidation = {
  ok: boolean
  authenticated: boolean
  authorized: boolean
  providerIntegrated: false
  errors: string[]
  warnings: string[]
  identity?: OperatorIdentity
}

export type OperatorAuthorizationRequest = {
  identity?: OperatorIdentity | null
  requiredRole?: OperatorRole
  requiredPermission?: OperatorPermission
  route?: string
}

export const OPERATOR_AUTH_CONTRACT_STATUS = {
  providerIntegrated: false,
  sessionHandling: false,
  jwtImplementation: false,
  externalAuthProvider: "none",
  executionEnabled: false,
} as const

export function validateOperator(
  identity?: OperatorIdentity | null
): OperatorAuthValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!identity?.actorId) {
    errors.push("actorId is required for operator identity.")
  }

  if (!identity?.role || !getOperatorRole(identity.role)) {
    errors.push("A known operator role is required.")
  }

  if (identity && !identity.organizationId) {
    warnings.push("organizationId should be present before production execution.")
  }

  if (identity && !identity.workspaceId) {
    warnings.push("workspaceId should be present before tenant-scoped writes.")
  }

  return {
    ok: errors.length === 0,
    authenticated: errors.length === 0,
    authorized: false,
    providerIntegrated: false,
    errors,
    warnings,
    identity: identity ?? undefined,
  }
}

export function requireRole(
  request: OperatorAuthorizationRequest
): OperatorAuthValidation {
  const validation = validateOperator(request.identity)
  if (!validation.ok || !request.requiredRole || !request.identity) {
    return validation
  }

  const role = getOperatorRole(request.identity.role)
  const requiredRole = getOperatorRole(request.requiredRole)
  const authorized =
    Boolean(role && requiredRole) &&
    roleRiskRank(role!.riskLevel) >= roleRiskRank(requiredRole!.riskLevel)

  return {
    ...validation,
    authorized,
    errors: authorized
      ? validation.errors
      : [
          ...validation.errors,
          `Role ${request.identity.role} does not satisfy required role ${request.requiredRole}.`,
        ],
  }
}

export function requirePermission(
  request: OperatorAuthorizationRequest
): OperatorAuthValidation {
  const validation = validateOperator(request.identity)
  if (!validation.ok || !request.requiredPermission || !request.identity) {
    return validation
  }

  const explicitPermission = request.identity.permissions?.includes(
    request.requiredPermission
  )
  const rolePermission = roleHasPermission(
    request.identity.role,
    request.requiredPermission
  )
  const authorized = Boolean(explicitPermission || rolePermission)

  return {
    ...validation,
    authorized,
    errors: authorized
      ? validation.errors
      : [
          ...validation.errors,
          `Permission ${request.requiredPermission} is required.`,
        ],
  }
}

export function isOperatorAuthorized(request: OperatorAuthorizationRequest) {
  if (request.requiredPermission) {
    return requirePermission(request).authorized
  }

  if (request.requiredRole) {
    return requireRole(request).authorized
  }

  return validateOperator(request.identity).ok
}

function roleRiskRank(riskLevel: string) {
  const ranks: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  }
  return ranks[riskLevel] ?? 0
}
