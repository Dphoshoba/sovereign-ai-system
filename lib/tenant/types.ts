export type TenantStatus = "active" | "inactive" | "suspended"

export type TenantConfig = {
  id: string
  name: string
  status: TenantStatus
  missionCount: number
  knowledgeCount: number
  assetCount: number
  userCount: number
  dashboardCount: number
  aiEnabled: boolean
  createdAt: number
}

export type TenantMetrics = {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  avgMissionsPerTenant: number
  healthScore: number
}

export type TenantWorkspace = {
  tenants: TenantConfig[]
  metrics: TenantMetrics
}
