export type EnterpriseWorkspaceType =
  | "research"
  | "creator"
  | "ministry"
  | "executive"
  | "agency"
  | "shared-knowledge"

export type EnterpriseWorkspace = {
  id: string
  name: string
  type: EnterpriseWorkspaceType
  purpose: string
  defaultDepartmentId: string
  allowedRoles: string[]
  sharedKnowledgeAccess: "read" | "read-propose" | "blocked"
  writeStatus: "blocked"
  dataClassification: "internal" | "confidential" | "restricted"
}

export function buildEnterpriseWorkspaces(): EnterpriseWorkspace[] {
  return [
    {
      id: "research-workspace",
      name: "Research Workspace",
      type: "research",
      purpose: "Plan and review source-grounded research missions.",
      defaultDepartmentId: "research-intelligence",
      allowedRoles: ["research-lead", "reviewer", "administrator"],
      sharedKnowledgeAccess: "read-propose",
      writeStatus: "blocked",
      dataClassification: "confidential",
    },
    {
      id: "creator-workspace",
      name: "Creator Workspace",
      type: "creator",
      purpose: "Prepare governed content campaigns and draft preview packets.",
      defaultDepartmentId: "creator-growth",
      allowedRoles: ["content-strategist", "reviewer", "publisher", "administrator"],
      sharedKnowledgeAccess: "read-propose",
      writeStatus: "blocked",
      dataClassification: "confidential",
    },
    {
      id: "ministry-workspace",
      name: "Ministry Workspace",
      type: "ministry",
      purpose: "Model sermon, teaching, discipleship, and ministry knowledge workflows.",
      defaultDepartmentId: "ministry-operations",
      allowedRoles: ["ministry-lead", "reviewer", "administrator"],
      sharedKnowledgeAccess: "read-propose",
      writeStatus: "blocked",
      dataClassification: "restricted",
    },
    {
      id: "executive-workspace",
      name: "Executive Workspace",
      type: "executive",
      purpose: "Surface readiness, governance, operator, and enterprise planning state.",
      defaultDepartmentId: "executive-office",
      allowedRoles: ["executive", "administrator"],
      sharedKnowledgeAccess: "read",
      writeStatus: "blocked",
      dataClassification: "restricted",
    },
    {
      id: "agency-workspace",
      name: "Agency Workspace",
      type: "agency",
      purpose: "Plan client, delivery, growth, and campaign operating workflows.",
      defaultDepartmentId: "agency-delivery",
      allowedRoles: ["agency-lead", "operator", "administrator"],
      sharedKnowledgeAccess: "read-propose",
      writeStatus: "blocked",
      dataClassification: "confidential",
    },
    {
      id: "shared-knowledge-workspace",
      name: "Shared Knowledge Layer",
      type: "shared-knowledge",
      purpose: "Provide governed shared knowledge proposals across enterprise workspaces.",
      defaultDepartmentId: "executive-office",
      allowedRoles: ["review-board", "administrator"],
      sharedKnowledgeAccess: "blocked",
      writeStatus: "blocked",
      dataClassification: "restricted",
    },
  ]
}

export function evaluateWorkspaceReadiness(
  workspaces: EnterpriseWorkspace[] = buildEnterpriseWorkspaces()
) {
  const requiredTypes: EnterpriseWorkspaceType[] = [
    "research",
    "creator",
    "ministry",
    "executive",
    "agency",
    "shared-knowledge",
  ]
  const coveredTypes = requiredTypes.filter((type) =>
    workspaces.some((workspace) => workspace.type === type)
  )
  const allWritesBlocked = workspaces.every(
    (workspace) => workspace.writeStatus === "blocked"
  )
  const score = Math.round(
    ((coveredTypes.length + (allWritesBlocked ? 1 : 0)) /
      (requiredTypes.length + 1)) *
      100
  )

  return {
    score,
    status: "CONTRACT_READY" as const,
    workspaceCount: workspaces.length,
    coveredTypes,
    allWritesBlocked,
  }
}

