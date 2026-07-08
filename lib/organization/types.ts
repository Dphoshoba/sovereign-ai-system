export type OrganizationType = "church" | "business" | "ministry" | "school" | "government" | "nonprofit"

export type OrganizationRecord = {
  id: string
  name: string
  type: OrganizationType
  status: "active" | "inactive"
  memberCount: number
  dataIsolated: boolean
  region: string
  createdAt: number
}

export type OrganizationMetrics = {
  totalOrganizations: number
  activeOrganizations: number
  byType: Record<OrganizationType, number>
  healthScore: number
}

export type OrganizationWorkspace = {
  organizations: OrganizationRecord[]
  metrics: OrganizationMetrics
}
