export type ExecutionItem = {
  title: string
  status: "blocked" | "at-risk" | "on-track" | "completed"
  priority: "critical" | "high" | "medium" | "low"
  progress: number
  dueDate: string
}

export type ExecutionRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionExecutionWorkspace = {
  mission: string
  missionTitle: string
  taskCount: number
  activeProjects: number
  executionCapacity: number
  executionVelocity: number
  bottlenecks: number
  blockedItems: number
  focusScore: number
  deliveryScore: number
  healthScore: number
  execution: ExecutionItem[]
  recommendations: string[]
  roadmap: ExecutionRoadmapItem[]
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
