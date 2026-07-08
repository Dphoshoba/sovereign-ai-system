export interface MissionMissionExecutionControlWorkspace {
  mission: string
  missionTitle: string
  executionScore: number
  taskCompletion: number
  milestoneTracking: number
  resourceUtilization: number
  timelineAdherence: number
  qualityAssurance: number
  teamCoordination: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface MissionExecutionControlRegistry {
  executionScore: number
  taskCompletion: number
  milestoneTracking: number
  resourceUtilization: number
  timelineAdherence: number
  qualityAssurance: number
  teamCoordination: number
  healthScore: number
  missions: MissionMissionExecutionControlWorkspace[]
}
