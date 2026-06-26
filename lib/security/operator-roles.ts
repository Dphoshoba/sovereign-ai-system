import type { OperatorPermission } from "./operator-permissions"

export type OperatorRole =
  | "viewer"
  | "reviewer"
  | "operator"
  | "publisher"
  | "administrator"
  | "system"

export type OperatorRoleDefinition = {
  role: OperatorRole
  displayName: string
  permissions: OperatorPermission[]
  allowedRoutes: string[]
  approvalCapabilities: string[]
  writeCapabilities: string[]
  riskLevel: "low" | "medium" | "high" | "critical"
}

export const OPERATOR_ROLE_DEFINITIONS: OperatorRoleDefinition[] = [
  {
    role: "viewer",
    displayName: "Viewer",
    permissions: [
      "operator:dashboard:read",
      "operator:actions:read",
      "operator:readiness:read",
      "operator:security:read",
      "system:readiness:read",
    ],
    allowedRoutes: [
      "/api/ev-kos/operator-dashboard",
      "/api/ev-kos/operator-actions",
      "/api/ev-kos/operator-readiness-audit",
      "/api/production/*",
      "/api/security/operator-readiness",
    ],
    approvalCapabilities: [],
    writeCapabilities: [],
    riskLevel: "low",
  },
  {
    role: "reviewer",
    displayName: "Reviewer",
    permissions: [
      "operator:dashboard:read",
      "operator:actions:read",
      "operator:actions:preview",
      "operator:readiness:read",
      "operator:research:preview",
      "operator:content:preview",
      "operator:ontology:preview",
      "operator:graph-readiness:preview",
      "operator:security:read",
    ],
    allowedRoutes: [
      "/api/ev-kos/*",
      "/api/content/*",
      "/api/research/missions*",
      "/api/ontology/*",
      "/api/production/*",
      "/api/security/operator-readiness",
    ],
    approvalCapabilities: ["review-readiness", "request-more-information"],
    writeCapabilities: [],
    riskLevel: "medium",
  },
  {
    role: "operator",
    displayName: "Operator",
    permissions: [
      "operator:dashboard:read",
      "operator:actions:read",
      "operator:actions:preview",
      "operator:intent:create",
      "operator:readiness:read",
      "operator:research:preview",
      "operator:content:preview",
      "operator:ontology:preview",
      "operator:review-package:create",
      "operator:graph-readiness:preview",
      "operator:security:read",
    ],
    allowedRoutes: [
      "/api/ev-kos/*",
      "/api/content/*",
      "/api/research/*",
      "/api/ontology/*",
      "/api/production/*",
      "/api/security/operator-readiness",
    ],
    approvalCapabilities: ["create-intent-package", "create-review-package"],
    writeCapabilities: [
      "pending ExecutionAuthorizationRequest intent packages",
      "pending ExecutionAuthorizationRequest review packages",
    ],
    riskLevel: "high",
  },
  {
    role: "publisher",
    displayName: "Publisher",
    permissions: [
      "operator:dashboard:read",
      "operator:actions:read",
      "operator:actions:preview",
      "operator:intent:create",
      "operator:content:preview",
      "operator:publishing:preview",
      "operator:security:read",
    ],
    allowedRoutes: [
      "/api/ev-kos/*",
      "/api/content/*",
      "/api/production/*",
      "/api/security/operator-readiness",
    ],
    approvalCapabilities: ["publication-readiness-review"],
    writeCapabilities: ["pending operator intent packages only"],
    riskLevel: "high",
  },
  {
    role: "administrator",
    displayName: "Administrator",
    permissions: [
      "operator:dashboard:read",
      "operator:actions:read",
      "operator:actions:preview",
      "operator:intent:create",
      "operator:readiness:read",
      "operator:research:preview",
      "operator:content:preview",
      "operator:ontology:preview",
      "operator:review-package:create",
      "operator:graph-readiness:preview",
      "operator:graph-test-write:request",
      "operator:publishing:preview",
      "operator:security:read",
      "operator:admin:manage",
      "system:readiness:read",
    ],
    allowedRoutes: [
      "/api/ev-kos/*",
      "/api/content/*",
      "/api/research/*",
      "/api/ontology/*",
      "/api/production/*",
      "/api/security/operator-readiness",
    ],
    approvalCapabilities: [
      "authorize-controlled-test-write-request",
      "manage-operator-security-policy",
    ],
    writeCapabilities: [
      "pending intent packages",
      "pending review packages",
      "explicit-test-write request only; no automatic graph execution",
    ],
    riskLevel: "critical",
  },
  {
    role: "system",
    displayName: "System",
    permissions: ["system:readiness:read", "operator:security:read"],
    allowedRoutes: ["/api/production/*", "/api/security/operator-readiness"],
    approvalCapabilities: [],
    writeCapabilities: [],
    riskLevel: "critical",
  },
]

export function listOperatorRoles() {
  return OPERATOR_ROLE_DEFINITIONS
}

export function getOperatorRole(roleName: string) {
  return (
    OPERATOR_ROLE_DEFINITIONS.find((definition) => definition.role === roleName) ??
    null
  )
}

export function roleHasPermission(roleName: string, permission: OperatorPermission) {
  const role = getOperatorRole(roleName)
  return Boolean(role?.permissions.includes(permission))
}
