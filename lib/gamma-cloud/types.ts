export type RegionStatus = "online" | "degraded" | "offline"
export type CloudStatus = "operational" | "degraded" | "outage"

export type CloudRegion = {
  id: string
  name: string
  status: RegionStatus
  organizationCount: number
  latency: number
}

export type GammaCloudMetrics = {
  organizations: number
  users: number
  aiAgents: number
  deployments: number
  licenses: number
  revenue: number
  marketplaceModules: number
  health: number
  regions: number
  liveStatus: CloudStatus
}

export type GammaCloudWorkspace = {
  regions: CloudRegion[]
  metrics: GammaCloudMetrics
}
