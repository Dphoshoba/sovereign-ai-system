export type EnterpriseProject = {
  id: string
  name: string
  owningDepartmentId: string
  workspaceIds: string[]
  status: "planned"
}

export type EnterpriseOrganizationNode = {
  id: string
  name: string
  type: "organization"
  departments: string[]
  teams: string[]
  projects: EnterpriseProject[]
  workspaces: string[]
  sharedKnowledgeLayer: {
    id: "shared-knowledge-layer"
    status: "contract-only"
    allowedConsumers: string[]
    writePolicy: "blocked-pending-governance"
  }
}

export function buildEnterpriseOrganizationHierarchy(): EnterpriseOrganizationNode {
  return {
    id: "ev-kos-enterprise",
    name: "EV-KOS Enterprise",
    type: "organization",
    departments: [
      "research-intelligence",
      "creator-growth",
      "ministry-operations",
      "executive-office",
      "agency-delivery",
    ],
    teams: [
      "research-operators",
      "content-operators",
      "review-board",
      "enterprise-admins",
      "client-delivery",
    ],
    projects: [
      {
        id: "enterprise-alpha",
        name: "Enterprise Alpha",
        owningDepartmentId: "executive-office",
        workspaceIds: ["executive-workspace", "shared-knowledge-workspace"],
        status: "planned",
      },
      {
        id: "knowledge-ingestion-readiness",
        name: "Knowledge Ingestion Readiness",
        owningDepartmentId: "research-intelligence",
        workspaceIds: ["research-workspace", "shared-knowledge-workspace"],
        status: "planned",
      },
    ],
    workspaces: [
      "research-workspace",
      "creator-workspace",
      "ministry-workspace",
      "executive-workspace",
      "agency-workspace",
      "shared-knowledge-workspace",
    ],
    sharedKnowledgeLayer: {
      id: "shared-knowledge-layer",
      status: "contract-only",
      allowedConsumers: [
        "research-workspace",
        "creator-workspace",
        "ministry-workspace",
        "executive-workspace",
        "agency-workspace",
      ],
      writePolicy: "blocked-pending-governance",
    },
  }
}

export function evaluateOrganizationReadiness(
  organization: EnterpriseOrganizationNode = buildEnterpriseOrganizationHierarchy()
) {
  const expectedSections = [
    organization.departments.length > 0,
    organization.teams.length > 0,
    organization.projects.length > 0,
    organization.workspaces.length >= 5,
    organization.sharedKnowledgeLayer.status === "contract-only",
  ]
  const complete = expectedSections.filter(Boolean).length

  return {
    score: Math.round((complete / expectedSections.length) * 100),
    status: "CONTRACT_READY" as const,
    missing: expectedSections.length - complete,
    notes: [
      "Organization topology is defined as a contract only.",
      "Persistence and tenant enforcement remain future work.",
    ],
  }
}

