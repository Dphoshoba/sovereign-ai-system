export type PrioritizationItem = {
  title: string
  impactScore: number
  effortScore: number
  roiScore: number
  urgencyScore: number
  alignmentScore: number
  focusScore: number
}

export type PrioritizationRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionPrioritizationWorkspace = {
  mission: string
  missionTitle: string
  priorityCount: number
  impactScore: number
  effortScore: number
  roiScore: number
  urgencyScore: number
  alignmentScore: number
  focusScore: number
  healthScore: number
  priorities: PrioritizationItem[]
  recommendations: string[]
  roadmap: PrioritizationRoadmapItem[]
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
