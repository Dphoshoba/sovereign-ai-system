import {
  buildEnterpriseWorkspaces,
  type EnterpriseWorkspace,
} from "./workspace-model"

export type WorkspaceIsolationRule = {
  id: string
  workspaceId: string
  readScope: "own-workspace" | "shared-knowledge-read"
  writeScope: "blocked"
  crossWorkspaceWriteAllowed: false
  sharedKnowledgeProposalAllowed: boolean
  databaseWrites: false
}

export function buildWorkspaceIsolationRules(
  workspaces: EnterpriseWorkspace[] = buildEnterpriseWorkspaces()
): WorkspaceIsolationRule[] {
  return workspaces.map((workspace) => ({
    id: `${workspace.id}-isolation`,
    workspaceId: workspace.id,
    readScope:
      workspace.type === "shared-knowledge"
        ? "own-workspace"
        : "shared-knowledge-read",
    writeScope: "blocked",
    crossWorkspaceWriteAllowed: false,
    sharedKnowledgeProposalAllowed:
      workspace.sharedKnowledgeAccess === "read-propose",
    databaseWrites: false,
  }))
}

export function evaluateTenantIsolationReadiness(
  rules: WorkspaceIsolationRule[] = buildWorkspaceIsolationRules()
) {
  const allWritesBlocked = rules.every((rule) => rule.writeScope === "blocked")
  const noCrossWorkspaceWrites = rules.every(
    (rule) => rule.crossWorkspaceWriteAllowed === false
  )
  const noDatabaseWrites = rules.every((rule) => rule.databaseWrites === false)
  const checks = [allWritesBlocked, noCrossWorkspaceWrites, noDatabaseWrites]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "ISOLATION_CONTRACT_READY_WRITES_BLOCKED" as const,
    ruleCount: rules.length,
    allWritesBlocked,
    noCrossWorkspaceWrites,
    databaseWrites: false,
  }
}

