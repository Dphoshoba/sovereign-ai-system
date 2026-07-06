export type PlannerTaskWindow = "today" | "week" | "month"

export type PlannerTaskPriority = "high" | "medium" | "low"

export type PlannerTask = {
  id: string
  title: string
  window: PlannerTaskWindow
  priority: PlannerTaskPriority
  workspace: string
  isBlocker: boolean
  dependencies: string[]
  rationale: string
}

export type PlannerRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionPlannerWorkspace = {
  mission: string
  missionTitle: string
  taskCount: number
  todayCount: number
  weekCount: number
  monthCount: number
  dependencyCount: number
  blockerCount: number
  executionReadiness: number
  momentum: number
  roadmapScore: number
  deliveryScore: number
  priorityScore: number
  healthScore: number
  recommendationCount: number
  today: PlannerTask[]
  week: PlannerTask[]
  month: PlannerTask[]
  dependencies: PlannerTask[]
  blockers: PlannerTask[]
  roadmap: PlannerRoadmapItem[]
  priorityQueue: PlannerTask[]
  executionPlan: string[]
  missionSchedule: string[]
  recommendations: string[]
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