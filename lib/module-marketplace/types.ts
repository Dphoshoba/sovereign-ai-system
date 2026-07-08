export type PackType = "ministry" | "business" | "school" | "research" | "creator"
export type ModuleStatus = "available" | "installed" | "deprecated"

export type MarketplaceModule = {
  id: string
  name: string
  pack: PackType
  version: string
  status: ModuleStatus
  description: string
  downloads: number
}

export type MarketplaceMetrics = {
  totalModules: number
  installedModules: number
  totalDownloads: number
  healthScore: number
}

export type ModuleMarketplaceWorkspace = {
  modules: MarketplaceModule[]
  metrics: MarketplaceMetrics
}
