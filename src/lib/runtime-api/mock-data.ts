import { RuntimeAPI, RuntimeEndpoint } from './types'

const FIXED_TIMESTAMP = 1751990400000

const endpoints: RuntimeEndpoint[] = [
  { id: 'ep-001', path: '/api/gamma/runtime/preview', method: 'GET', type: 'preview', safetyLevel: 'safe', requiresApproval: false },
  { id: 'ep-002', path: '/api/gamma/runtime/status', method: 'GET', type: 'status', safetyLevel: 'safe', requiresApproval: false },
  { id: 'ep-003', path: '/api/gamma/runtime/simulate', method: 'POST', type: 'preview', safetyLevel: 'restricted', requiresApproval: true },
  { id: 'ep-004', path: '/api/gamma/runtime/audit', method: 'GET', type: 'preview', safetyLevel: 'safe', requiresApproval: false },
  { id: 'ep-005', path: '/api/gamma/runtime/queue', method: 'GET', type: 'status', safetyLevel: 'safe', requiresApproval: false },
]

export const getRuntimeAPIMockData = (): RuntimeAPI => {
  const preview = endpoints.filter(e => e.type === 'preview').length
  const mutation = endpoints.filter(e => e.type === 'mutation').length
  const blocked = endpoints.filter(e => e.safetyLevel === 'blocked').length

  return {
    id: 'runtime-api-001',
    version: '1.0.0',
    status: 'operational',
    endpoints,
    metrics: {
      runtimeEndpointCount: endpoints.length,
      previewEndpointCount: preview,
      mutationEndpointCount: mutation,
      blockedEndpointCount: blocked,
      apiSafetyScore: 96,
      healthScore: 95,
    },
    lastSync: FIXED_TIMESTAMP,
  }
}
