export type KnowledgeIntelligenceConfidence = "low" | "moderate" | "high" | "very-high"

export type KnowledgeIntelligenceStatus = "active" | "reviewing" | "planned"

export type KnowledgeIntelligenceSignal = {
  id: string
  title: string
  source: string
  score: number
  status: "strong" | "watch" | "needs-work"
}

export type KnowledgeIntelligenceWorkspaceStatus = {
  workspace: "research" | "creator" | "ministry" | "executive" | "agency" | "shared-knowledge" | "second-brain" | "mission-registry"
  status: "active" | "reviewing" | "planned" | "stalled"
  progress: number
}

export type KnowledgeIntelligenceTimelineEntry = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type KnowledgeIntelligenceGraphNode = {
  id: string
  label: string
  type: "workspace" | "layer" | "mission"
}

export type KnowledgeIntelligenceGraphEdge = {
  from: string
  to: string
  relation: string
}

export type KnowledgeIntelligenceWorkspace = {
  id: string
  name: string
  missionTitle: string
  status: KnowledgeIntelligenceStatus
  confidence: KnowledgeIntelligenceConfidence
  intelligenceScore: number
  knowledgeHealthScore: number
  brainHealthScore: number
  missionCount: number
  workspaceCount: number
  signalCount: number
  insightCount: number
  patternCount: number
  recommendationCount: number
  timelineCount: number
  discoveryCount: number
  assetCount: number
  frameworkCount: number
  questionCount: number
  teachingCount: number
  courseCount: number
  presentationCount: number
  decisionCount: number
  promptCount: number
  crossReferenceCount: number
  coverageCount: number
  researchCoverage: number
  creatorCoverage: number
  ministryCoverage: number
  executiveCoverage: number
  agencyCoverage: number
  knowledgeCoverage: number
  overallScore: number
  knowledgeDomains: string[]
  intelligenceSignals: KnowledgeIntelligenceSignal[]
  insights: string[]
  patterns: string[]
  recommendations: string[]
  dailyQuestions: string[]
  weeklyReview: string[]
  relationshipView: string[]
  missionNavigator: string[]
  crossWorkspaceSummary: string[]
  workspaceStatus: KnowledgeIntelligenceWorkspaceStatus[]
  timeline: KnowledgeIntelligenceTimelineEntry[]
  relatedMissions: Array<{
    id: string
    title: string
    status: string
  }>
  signalPreview: string[]
  knowledgeGraphPreview: {
    nodes: KnowledgeIntelligenceGraphNode[]
    edges: KnowledgeIntelligenceGraphEdge[]
  }
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
