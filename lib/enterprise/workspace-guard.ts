import {
  buildEnterpriseWorkspaces,
  type EnterpriseWorkspace,
} from "./workspace-model"

export type WorkspaceGuardRule = {
  id: string
  workspaceId: string
  allowedRoleIds: string[]
  readBoundary: "workspace-and-approved-shared-knowledge"
  writeBoundary: "blocked"
  crossWorkspaceAccess: "blocked-unless-shared-knowledge-read"
  mode: "report-only"
}

export function buildWorkspaceGuardRules(
  workspaces: EnterpriseWorkspace[] = buildEnterpriseWorkspaces()
): WorkspaceGuardRule[] {
  return workspaces.map((workspace) => ({
    id: `${workspace.id}-guard`,
    workspaceId: workspace.id,
    allowedRoleIds: workspace.allowedRoles,
    readBoundary: "workspace-and-approved-shared-knowledge",
    writeBoundary: "blocked",
    crossWorkspaceAccess: "blocked-unless-shared-knowledge-read",
    mode: "report-only",
  }))
}

export function evaluateWorkspaceContainment(
  rules: WorkspaceGuardRule[] = buildWorkspaceGuardRules()
) {
  const allWritesBlocked = rules.every((rule) => rule.writeBoundary === "blocked")
  const allReportOnly = rules.every((rule) => rule.mode === "report-only")
  const allRoleScoped = rules.every((rule) => rule.allowedRoleIds.length > 0)
  const checks = [allWritesBlocked, allReportOnly, allRoleScoped]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "WORKSPACE_BOUNDARIES_REPORT_ONLY" as const,
    ruleCount: rules.length,
    allWritesBlocked,
    allRoleScoped,
  }
}

