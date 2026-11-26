export type EnterpriseDepartment = {
  id: string
  name: string
  purpose: string
  defaultWorkspaceIds: string[]
  policyDomain: string
  status: "planned"
}

export function buildEnterpriseDepartments(): EnterpriseDepartment[] {
  return [
    {
      id: "research-intelligence",
      name: "Research Intelligence",
      purpose: "Own source-grounded missions, evidence quality, and ontology proposals.",
      defaultWorkspaceIds: ["research-workspace", "shared-knowledge-workspace"],
      policyDomain: "research",
      status: "planned",
    },
    {
      id: "creator-growth",
      name: "Creator Growth",
      purpose: "Own creator campaigns, draft previews, and channel planning.",
      defaultWorkspaceIds: ["creator-workspace"],
      policyDomain: "content",
      status: "planned",
    },
    {
      id: "ministry-operations",
      name: "Ministry Operations",
      purpose: "Own ministry knowledge, sermon planning, and teaching workflows.",
      defaultWorkspaceIds: ["ministry-workspace"],
      policyDomain: "ministry",
      status: "planned",
    },
    {
      id: "executive-office",
      name: "Executive Office",
      purpose: "Own governance, readiness, approvals, and enterprise operating doctrine.",
      defaultWorkspaceIds: ["executive-workspace", "shared-knowledge-workspace"],
      policyDomain: "governance",
      status: "planned",
    },
    {
      id: "agency-delivery",
      name: "Agency Delivery",
      purpose: "Own client delivery, campaigns, and commercial operating workflows.",
      defaultWorkspaceIds: ["agency-workspace"],
      policyDomain: "delivery",
      status: "planned",
    },
  ]
}

