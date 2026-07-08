export interface MissionOperationsCommandWorkspace {
  mission: string
  missionTitle: string
  commandScore: number
  executionReadiness: number
  systemReliability: number
  resourceCoordination: number
  responseTime: number
  decisionQuality: number
  operationalExcellence: number
  healthScore: number
  previewOnly: boolean
  noAuth: boolean
  noDatabase: boolean
}

export interface OperationsCommandRegistry {
  commandScore: number
  executionReadiness: number
  systemReliability: number
  resourceCoordination: number
  responseTime: number
  decisionQuality: number
  operationalExcellence: number
  healthScore: number
  missions: MissionOperationsCommandWorkspace[]
}
