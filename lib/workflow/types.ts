export type WorkflowStep = {
  stepId: string
  title: string
  status: "pending" | "active" | "completed" | "blocked"
  automationLevel: number
}

export type WorkflowRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionWorkflowWorkspace = {
  mission: string
  missionTitle: string
  workflowCount: number
  automationCoverage: number
  executionChains: number
  completionRate: number
  dependencyCount: number
  healthScore: number
  workflows: WorkflowStep[]
  recommendations: string[]
  roadmap: WorkflowRoadmapItem[]
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
