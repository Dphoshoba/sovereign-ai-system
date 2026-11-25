import type { AnalyticsWorkspace } from "./types"

export const ANALYTICS_ASSETS: AnalyticsWorkspace = {
  commercial: {
    revenue: 1138200,
    mrr: 94850,
    arr: 1138200,
    userGrowth: 18,
    workspaceUsage: 84,
    aiUsage: 72,
    knowledgeGrowth: 23,
    missionHealth: 91,
  },
  metrics: [
    { name: "Revenue", value: 1138200, period: "annual", trend: "up" },
    { name: "MRR", value: 94850, period: "monthly", trend: "up" },
    { name: "ARR", value: 1138200, period: "annual", trend: "up" },
    { name: "User Growth", value: 18, period: "monthly", trend: "up" },
    { name: "Workspace Usage", value: 84, period: "weekly", trend: "stable" },
    { name: "AI Usage", value: 72, period: "weekly", trend: "up" },
    { name: "Knowledge Growth", value: 23, period: "monthly", trend: "up" },
    { name: "Mission Health", value: 91, period: "weekly", trend: "stable" },
  ],
  period: "monthly",
  healthScore: 93,
}
