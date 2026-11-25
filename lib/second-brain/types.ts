export type SecondBrainConfidence = "low" | "moderate" | "high" | "very-high"

export type SecondBrainWorkspaceStatus = {
  workspace: "research" | "creator" | "ministry" | "executive" | "agency" | "shared-knowledge" | "mission-registry"
  status: "active" | "reviewing" | "planned" | "stalled"
  progress: number
}

export type SecondBrainGrowthIndicator = {
  date: string
  discoveries: number
  assets: number
  score: number
}

export type SecondBrainTimelineEntry = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type SecondBrainWorkspace = {
  id: string
  name: string
  currentMission: string
  missionCount: number
  workspaceCount: number
  discoveryCount: number
  assetCount: number
  timelineCount: number
  priorityCount: number
  actionCount: number
  healthScore: number
  brainScore: number
  crossReferenceCount: number
  confidence: SecondBrainConfidence
  researchProgress: number
  creatorProgress: number
  ministryProgress: number
  executivePriorities: string[]
  agencyPipeline: string
  knowledgeAssets: string[]
  suggestedActions: string[]
  recentDiscoveries: string[]
  stalledMissions: string[]
  dailyReview: string[]
  weeklyReview: string[]
  dailyPrompts: string[]
  crossWorkspaceSummary: string[]
  growthIndicators: SecondBrainGrowthIndicator[]
  timeline: SecondBrainTimelineEntry[]
  workspaceStatus: SecondBrainWorkspaceStatus[]
  relatedMissions: Array<{
    id: string
    title: string
    status: string
  }>
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
