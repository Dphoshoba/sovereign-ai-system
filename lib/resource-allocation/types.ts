export type ResourceAllocation = {
  resourceId: string
  resourceType: string
  allocated: number
  utilized: number
  efficiency: number
}

export type ResourceRoadmapItem = {
  date: string
  event: string
  status: "completed" | "in-progress" | "planned"
}

export type MissionResourceAllocationWorkspace = {
  mission: string
  missionTitle: string
  resourceCount: number
  allocationEfficiency: number
  utilizationScore: number
  capacityScore: number
  optimizationScore: number
  healthScore: number
  resources: ResourceAllocation[]
  recommendations: string[]
  roadmap: ResourceRoadmapItem[]
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
