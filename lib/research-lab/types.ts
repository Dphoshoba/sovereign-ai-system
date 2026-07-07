export type ResearchProject = {
  projectId: string
  projectName: string
  discoveryCount: number
  frameworkScore: number
  experimentationLevel: number
}

export type ResearchRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionResearchLabWorkspace = {
  mission: string
  missionTitle: string
  researchProjects: number
  discoveries: number
  frameworks: number
  publicationScore: number
  experimentationScore: number
  healthScore: number
  projects: ResearchProject[]
  recommendations: string[]
  roadmap: ResearchRoadmapItem[]
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
