export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "annual"
export type TrendDirection = "up" | "down" | "stable"

export type AnalyticsMetric = {
  name: string
  value: number
  period: AnalyticsPeriod
  trend: TrendDirection
}

export type CommercialMetrics = {
  revenue: number
  mrr: number
  arr: number
  userGrowth: number
  workspaceUsage: number
  aiUsage: number
  knowledgeGrowth: number
  missionHealth: number
}

export type AnalyticsWorkspace = {
  commercial: CommercialMetrics
  metrics: AnalyticsMetric[]
  period: AnalyticsPeriod
  healthScore: number
}
