export interface RuntimeEndpoint {
  id: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  type: 'preview' | 'mutation' | 'status'
  safetyLevel: 'safe' | 'restricted' | 'blocked'
  requiresApproval: boolean
}

export interface RuntimeAPIMetrics {
  runtimeEndpointCount: number
  previewEndpointCount: number
  mutationEndpointCount: number
  blockedEndpointCount: number
  apiSafetyScore: number
  healthScore: number
}

export interface RuntimeAPI {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  endpoints: RuntimeEndpoint[]
  metrics: RuntimeAPIMetrics
  lastSync: number
}
