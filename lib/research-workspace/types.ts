export type KnowledgeDomain = 
  | "theology"
  | "history"
  | "philosophy"
  | "linguistics"
  | "textual-criticism"
  | "archaeology"
  | "geography"
  | "science"
  | "culture"

export type WorkspaceStatus = "active" | "reviewing" | "paused" | "completed" | "archived"

export type ConfidenceLevel = "low" | "moderate" | "high" | "very-high"

export type TimelineEntry = {
  timestamp: Date
  event: string
  discoveryCount?: number
  questionsAnswered?: number
  status: "pending" | "in-progress" | "completed"
}

export type ScriptureReference = {
  book: string
  chapter: number
  verse: number | string // e.g., "12-15" for range
  text: string
  confidence: ConfidenceLevel
  relatedDomains: KnowledgeDomain[]
}

export type DiscoveryItem = {
  id: string
  title: string
  description: string
  domain: KnowledgeDomain
  confidence: ConfidenceLevel
  sourceCount: number
  relatedTo: string[] // scriptureReferences or questionIds
  timestamp: Date
}

export type ResearchQuestion = {
  id: string
  question: string
  status: "unanswered" | "partial" | "answered"
  confidence: ConfidenceLevel
  domain: KnowledgeDomain
  discoveries: DiscoveryItem[]
  timestamp: Date
}

export type MissionCard = {
  id: string
  title: string
  objective: string
  status: "planned" | "active" | "blocked" | "completed"
  progress: number
  domain: KnowledgeDomain
  confidence: ConfidenceLevel
  questionsToAnswer: number
  questionsAnswered: number
  discoveriesToMake: number
  discoveriesMade: number
  startDate: Date
  estimatedCompletion?: Date
  scriptureReferences: ScriptureReference[]
}

export type RelatedWorkspace = {
  id: string
  name: string
  similarity: number // 0-100
  sharedDomains: KnowledgeDomain[]
  status: WorkspaceStatus
}

export type ResearchWorkspace = {
  id: string
  name: string
  description: string
  status: WorkspaceStatus
  createdAt: Date
  lastUpdated: Date
  
  // Core metrics
  overallProgress: number
  overallConfidence: ConfidenceLevel
  discoveryCount: number
  questionCount: number
  questionsAnswered: number
  scriptureReferenceCount: number
  
  // Detailed data
  missions: MissionCard[]
  discoveries: DiscoveryItem[]
  questions: ResearchQuestion[]
  scriptureReferences: ScriptureReference[]
  timeline: TimelineEntry[]
  domains: {
    domain: KnowledgeDomain
    count: number
    confidence: ConfidenceLevel
  }[]
  relatedWorkspaces: RelatedWorkspace[]
  
  // System flags
  readOnly: true
  noDatabase: true
  noExecution: true
  previewOnly: true
}
