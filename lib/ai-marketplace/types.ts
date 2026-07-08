export type AgentRole = "research" | "ministry" | "ceo" | "planner" | "writer" | "marketing" | "strategy"
export type AgentStatus = "available" | "deployed" | "inactive"

export type AIAgent = {
  id: string
  name: string
  role: AgentRole
  version: string
  status: AgentStatus
  description: string
  deploymentsCount: number
}

export type AIMarketplaceMetrics = {
  totalAgents: number
  deployedAgents: number
  totalDeployments: number
  healthScore: number
}

export type AIMarketplaceWorkspace = {
  agents: AIAgent[]
  metrics: AIMarketplaceMetrics
}
