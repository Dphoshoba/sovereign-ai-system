import { ActionRegistry, ActionDefinition, ActionType } from './types'

const FIXED_TIMESTAMP = 1751990400000

const actions: ActionDefinition[] = [
  {
    id: 'act-001',
    name: 'Create Document',
    actionType: 'create_document_preview',
    description: 'Generate document with text content',
    requiresApproval: true,
    safetyLevel: 'high',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'act-002',
    name: 'Create Plan',
    actionType: 'create_plan_preview',
    description: 'Synthesize execution plan',
    requiresApproval: true,
    safetyLevel: 'high',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'act-003',
    name: 'Draft Email',
    actionType: 'create_email_draft_preview',
    description: 'Compose email message draft',
    requiresApproval: true,
    safetyLevel: 'critical',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'act-004',
    name: 'Create Social Post',
    actionType: 'create_social_post_preview',
    description: 'Generate social media content',
    requiresApproval: true,
    safetyLevel: 'high',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'act-005',
    name: 'Block Calendar Time',
    actionType: 'create_calendar_block_preview',
    description: 'Reserve calendar time slot',
    requiresApproval: true,
    safetyLevel: 'medium',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'act-006',
    name: 'Create Task',
    actionType: 'create_task_preview',
    description: 'Create task assignment',
    requiresApproval: false,
    safetyLevel: 'low',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'act-007',
    name: 'Generate Report',
    actionType: 'create_report_preview',
    description: 'Create analytical report',
    requiresApproval: true,
    safetyLevel: 'high',
    status: 'available',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
]

export const getActionRegistryMockData = (): ActionRegistry => {
  const approvedCount = actions.filter(a => a.status === 'available').length
  const blockedCount = actions.filter(a => a.status === 'blocked').length
  const approvalRequiredCount = actions.filter(a => a.requiresApproval).length

  return {
    id: 'action-registry-001',
    version: '1.0.0',
    status: 'operational',
    actions,
    metrics: {
      actionCount: actions.length,
      approvedActionTypes: approvedCount,
      blockedActionTypes: blockedCount,
      approvalRequiredCount,
      safetyScore: 94,
      healthScore: 92,
    },
    lastSync: FIXED_TIMESTAMP,
  }
}
