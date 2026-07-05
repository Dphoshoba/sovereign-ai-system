export type SharedKnowledgeConfidence = "low" | "moderate" | "high" | "very-high"

export type SharedKnowledgeStatus = "active" | "reviewing" | "planned"

export type SharedKnowledgeCategory =
  | "discovery"
  | "principle"
  | "framework"
  | "prompt"
  | "template"
  | "script"
  | "teaching-model"
  | "book-structure"
  | "course-structure"
  | "service-model"
  | "reusable-component"

export type SharedKnowledgeAsset = {
  id: string
  title: string
  category: SharedKnowledgeCategory
  domain: string
  confidence: SharedKnowledgeConfidence
  status: "curated" | "draft" | "validated"
  tags: string[]
  crossReferences: string[]
  relatedMissions: string[]
  suggestedApplications: string[]
}

export type SharedKnowledgeTimelineEntry = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type SharedKnowledgeGraphNode = {
  id: string
  label: string
  type: "domain" | "asset" | "mission"
}

export type SharedKnowledgeGraphEdge = {
  from: string
  to: string
  relation: string
}

export type SharedKnowledgeWorkspace = {
  id: string
  name: string
  missionTitle: string
  status: SharedKnowledgeStatus
  confidence: SharedKnowledgeConfidence
  knowledgeHealthScore: number
  assetCount: number
  frameworkCount: number
  promptCount: number
  templateCount: number
  discoveryCount: number
  crossReferenceCount: number
  domainCount: number
  timelineCount: number
  knowledgeDomains: string[]
  knowledgeCategories: string[]
  knowledgeAssets: SharedKnowledgeAsset[]
  discoveries: string[]
  principles: string[]
  frameworks: string[]
  prompts: string[]
  templates: string[]
  scripts: string[]
  teachingModels: string[]
  bookStructures: string[]
  courseStructures: string[]
  serviceModels: string[]
  reusableComponents: string[]
  crossReferences: string[]
  tags: string[]
  timeline: SharedKnowledgeTimelineEntry[]
  relatedMissions: Array<{
    id: string
    title: string
    status: string
  }>
  suggestedApplications: string[]
  searchPreview: string[]
  knowledgeGraphPreview: {
    nodes: SharedKnowledgeGraphNode[]
    edges: SharedKnowledgeGraphEdge[]
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
