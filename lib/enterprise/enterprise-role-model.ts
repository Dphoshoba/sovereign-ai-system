export type EnterpriseRoleRisk = "low" | "medium" | "high" | "critical"

export type EnterpriseRole = {
  id: string
  name: string
  description: string
  workspaceScope: "single-workspace" | "multi-workspace" | "organization-wide"
  permissions: string[]
  approvalAuthority: "none" | "review-only" | "approval-ready" | "admin-policy"
  executionAllowed: false
  risk: EnterpriseRoleRisk
}

export function buildEnterpriseRoles(): EnterpriseRole[] {
  return [
    {
      id: "enterprise-viewer",
      name: "Enterprise Viewer",
      description: "Can inspect readiness, topology, and reports.",
      workspaceScope: "single-workspace",
      permissions: ["enterprise:readiness:read", "enterprise:topology:read"],
      approvalAuthority: "none",
      executionAllowed: false,
      risk: "low",
    },
    {
      id: "enterprise-reviewer",
      name: "Enterprise Reviewer",
      description: "Can review packages and request more information.",
      workspaceScope: "multi-workspace",
      permissions: ["enterprise:readiness:read", "enterprise:review:preview"],
      approvalAuthority: "review-only",
      executionAllowed: false,
      risk: "medium",
    },
    {
      id: "research-lead",
      name: "Research Lead",
      description: "Can plan research missions and review ontology proposals.",
      workspaceScope: "multi-workspace",
      permissions: ["research:mission:preview", "ontology:proposal:preview"],
      approvalAuthority: "review-only",
      executionAllowed: false,
      risk: "medium",
    },
    {
      id: "content-strategist",
      name: "Content Strategist",
      description: "Can plan campaigns and inspect draft preview packets.",
      workspaceScope: "multi-workspace",
      permissions: ["content:campaign:preview", "content:draft:preview"],
      approvalAuthority: "review-only",
      executionAllowed: false,
      risk: "medium",
    },
    {
      id: "enterprise-administrator",
      name: "Enterprise Administrator",
      description: "Can manage enterprise planning contracts after future approval.",
      workspaceScope: "organization-wide",
      permissions: ["enterprise:topology:read", "enterprise:policy:preview"],
      approvalAuthority: "admin-policy",
      executionAllowed: false,
      risk: "critical",
    },
  ]
}

export function evaluateRbacReadiness(roles: EnterpriseRole[] = buildEnterpriseRoles()) {
  const executionBlocked = roles.every((role) => role.executionAllowed === false)
  const hasAdmin = roles.some((role) => role.id === "enterprise-administrator")
  const hasReviewer = roles.some((role) => role.id === "enterprise-reviewer")
  const hasWorkspaceScopes = roles.every((role) => Boolean(role.workspaceScope))
  const checks = [executionBlocked, hasAdmin, hasReviewer, hasWorkspaceScopes]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "CONTRACT_READY_EXECUTION_BLOCKED" as const,
    roleCount: roles.length,
    executionBlocked,
  }
}

