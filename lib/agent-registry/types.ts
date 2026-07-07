export type AgentCapability = {
  name: string
  status: "active" | "inactive" | "learning"
}

export type AgentRegistryItem = {
  agentId: string
  agentName: string
  capabilities: number
  status: "available" | "busy" | "offline"
  missionCoverage: number
}

export type AgentRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionAgentRegistryWorkspace = {
  mission: string
  missionTitle: string
  agentCount: number
  activeAgents: number
  availableCapabilities: number
  missionCoverage: number
  coordinationScore: number
  healthScore: number
  agents: AgentRegistryItem[]
  recommendations: string[]
  roadmap: AgentRoadmapItem[]
  readOnly: true
  previewOnly: true
  noAuth: true
  noSessions: true
  noJwt: true
  noDatabase: true
  noExecution: true
  noPublishing: true
  noOpenAI: true
  noGraphWrites: true
  noSocialPosting: true
}
