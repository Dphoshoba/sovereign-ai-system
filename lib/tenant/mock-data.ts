import type { TenantWorkspace } from "./types"

const FIXED_TIMESTAMP = 1751990400000

export const TENANT_ASSETS: TenantWorkspace = {
  tenants: [
    {
      id: "tenant-001",
      name: "Sovereign AI Organization",
      status: "active",
      missionCount: 12,
      knowledgeCount: 450,
      assetCount: 230,
      userCount: 85,
      dashboardCount: 8,
      aiEnabled: true,
      createdAt: FIXED_TIMESTAMP,
    },
    {
      id: "tenant-002",
      name: "Faith Community Network",
      status: "active",
      missionCount: 6,
      knowledgeCount: 210,
      assetCount: 95,
      userCount: 42,
      dashboardCount: 4,
      aiEnabled: true,
      createdAt: FIXED_TIMESTAMP,
    },
    {
      id: "tenant-003",
      name: "Research Institute Global",
      status: "active",
      missionCount: 18,
      knowledgeCount: 820,
      assetCount: 340,
      userCount: 120,
      dashboardCount: 12,
      aiEnabled: true,
      createdAt: FIXED_TIMESTAMP,
    },
  ],
  metrics: {
    totalTenants: 3,
    activeTenants: 3,
    totalUsers: 247,
    avgMissionsPerTenant: 12,
    healthScore: 94,
  },
}
