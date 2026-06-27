export type EnterpriseTeam = {
  id: string
  name: string
  departmentId: string
  workspaceIds: string[]
  responsibilities: string[]
  executionStatus: "blocked"
}

export function buildEnterpriseTeams(): EnterpriseTeam[] {
  return [
    {
      id: "research-operators",
      name: "Research Operators",
      departmentId: "research-intelligence",
      workspaceIds: ["research-workspace"],
      responsibilities: ["mission planning", "evidence review", "ontology proposal review"],
      executionStatus: "blocked",
    },
    {
      id: "content-operators",
      name: "Content Operators",
      departmentId: "creator-growth",
      workspaceIds: ["creator-workspace"],
      responsibilities: ["campaign planning", "draft preview review", "lineage checks"],
      executionStatus: "blocked",
    },
    {
      id: "review-board",
      name: "Review Board",
      departmentId: "executive-office",
      workspaceIds: ["executive-workspace", "shared-knowledge-workspace"],
      responsibilities: ["review queue triage", "approval readiness", "risk escalation"],
      executionStatus: "blocked",
    },
    {
      id: "enterprise-admins",
      name: "Enterprise Admins",
      departmentId: "executive-office",
      workspaceIds: ["executive-workspace"],
      responsibilities: ["tenant contracts", "policy planning", "readiness reporting"],
      executionStatus: "blocked",
    },
    {
      id: "client-delivery",
      name: "Client Delivery",
      departmentId: "agency-delivery",
      workspaceIds: ["agency-workspace"],
      responsibilities: ["client workspace planning", "delivery readiness", "campaign governance"],
      executionStatus: "blocked",
    },
  ]
}

