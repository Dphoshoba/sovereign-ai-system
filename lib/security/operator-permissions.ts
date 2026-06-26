export type OperatorPermission =
  | "operator:dashboard:read"
  | "operator:actions:read"
  | "operator:actions:preview"
  | "operator:intent:create"
  | "operator:readiness:read"
  | "operator:research:preview"
  | "operator:content:preview"
  | "operator:ontology:preview"
  | "operator:review-package:create"
  | "operator:graph-readiness:preview"
  | "operator:graph-test-write:request"
  | "operator:publishing:preview"
  | "operator:security:read"
  | "operator:admin:manage"
  | "system:readiness:read"

export type OperatorPermissionDefinition = {
  permission: OperatorPermission
  description: string
  riskLevel: "low" | "medium" | "high" | "critical"
  writeCapability: "none" | "intent-package-only" | "review-package-only" | "explicit-test-write-only"
  requiresApproval: boolean
}

export const OPERATOR_PERMISSION_DEFINITIONS: OperatorPermissionDefinition[] = [
  permission("operator:dashboard:read", "Read the EV-KOS operator dashboard.", "low", "none", false),
  permission("operator:actions:read", "Read the governed operator action registry.", "low", "none", false),
  permission("operator:actions:preview", "Preview governed operator actions without execution.", "medium", "none", false),
  permission("operator:intent:create", "Create pending operator intent packages only.", "medium", "intent-package-only", true),
  permission("operator:readiness:read", "Read system and operator readiness summaries.", "low", "none", false),
  permission("operator:research:preview", "Preview research mission planning and dry-run state.", "medium", "none", false),
  permission("operator:content:preview", "Preview campaign, draft, and content orchestration readiness.", "medium", "none", false),
  permission("operator:ontology:preview", "Preview ontology, entity resolution, review queue, and graph readiness.", "medium", "none", false),
  permission("operator:review-package:create", "Create pending review packages without approving or executing.", "high", "review-package-only", true),
  permission("operator:graph-readiness:preview", "Preview semantic graph readiness and transaction boundaries.", "medium", "none", false),
  permission("operator:graph-test-write:request", "Request explicit controlled semantic graph test writes.", "critical", "explicit-test-write-only", true),
  permission("operator:publishing:preview", "Preview publication readiness without scheduling or publishing.", "high", "none", true),
  permission("operator:security:read", "Read security readiness and policy contracts.", "low", "none", false),
  permission("operator:admin:manage", "Manage future operator security configuration.", "critical", "none", true),
  permission("system:readiness:read", "Read production and startup readiness summaries.", "low", "none", false),
]

export function listOperatorPermissions() {
  return OPERATOR_PERMISSION_DEFINITIONS
}

export function getOperatorPermission(permissionName: string) {
  return (
    OPERATOR_PERMISSION_DEFINITIONS.find(
      (definition) => definition.permission === permissionName
    ) ?? null
  )
}

export function permissionsForRisk(
  riskLevel: OperatorPermissionDefinition["riskLevel"]
) {
  return OPERATOR_PERMISSION_DEFINITIONS.filter(
    (definition) => definition.riskLevel === riskLevel
  )
}

function permission(
  permissionName: OperatorPermission,
  description: string,
  riskLevel: OperatorPermissionDefinition["riskLevel"],
  writeCapability: OperatorPermissionDefinition["writeCapability"],
  requiresApproval: boolean
): OperatorPermissionDefinition {
  return {
    permission: permissionName,
    description,
    riskLevel,
    writeCapability,
    requiresApproval,
  }
}
