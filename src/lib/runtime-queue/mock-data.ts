import { RuntimeQueue, QueuedWorkItem } from './types'

const FIXED_TIMESTAMP = 1751990400000

const items: QueuedWorkItem[] = [
  { id: 'q-001', title: 'Email to Executive', status: 'waiting_approval', priority: 10, dependencies: [], estimatedTime: 300, createdAt: FIXED_TIMESTAMP },
  { id: 'q-002', title: 'Create Plan', status: 'ready', priority: 8, dependencies: [], estimatedTime: 1800, createdAt: FIXED_TIMESTAMP },
  { id: 'q-003', title: 'Social Post', status: 'ready', priority: 5, dependencies: ['q-002'], estimatedTime: 600, createdAt: FIXED_TIMESTAMP },
  { id: 'q-004', title: 'Calendar Block', status: 'blocked', priority: 3, dependencies: ['q-001'], estimatedTime: 120, createdAt: FIXED_TIMESTAMP },
  { id: 'q-005', title: 'Report Gen', status: 'pending', priority: 7, dependencies: [], estimatedTime: 2400, createdAt: FIXED_TIMESTAMP },
  { id: 'q-006', title: 'Task Assignment', status: 'ready', priority: 2, dependencies: [], estimatedTime: 180, createdAt: FIXED_TIMESTAMP },
]

export const getRuntimeQueueMockData = (): RuntimeQueue => {
  const readyCount = items.filter(i => i.status === 'ready').length
  const blockedCount = items.filter(i => i.status === 'blocked').length
  const waitingCount = items.filter(i => i.status === 'waiting_approval').length

  return {
    id: 'runtime-queue-001',
    version: '1.0.0',
    status: 'operational',
    items,
    metrics: {
      queueCount: items.length,
      readyCount,
      blockedCount,
      waitingForApprovalCount: waitingCount,
      dependencyCount: items.filter(i => i.dependencies.length > 0).length,
      queueHealth: 86,
      healthScore: 87,
    },
    lastSync: FIXED_TIMESTAMP,
  }
}
