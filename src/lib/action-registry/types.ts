export type ActionType =
  | 'create_document_preview'
  | 'create_plan_preview'
  | 'create_email_draft_preview'
  | 'create_social_post_preview'
  | 'create_calendar_block_preview'
  | 'create_task_preview'
  | 'create_report_preview'

export interface ActionDefinition {
  id: string
  name: string
  actionType: ActionType
  description: string
  requiresApproval: boolean
  safetyLevel: 'critical' | 'high' | 'medium' | 'low'
  status: 'available' | 'blocked' | 'deprecated'
  createdAt: number
  lastUpdated: number
}

export interface ActionRegistryMetrics {
  actionCount: number
  approvedActionTypes: number
  blockedActionTypes: number
  approvalRequiredCount: number
  safetyScore: number
  healthScore: number
}

export interface ActionRegistry {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  actions: ActionDefinition[]
  metrics: ActionRegistryMetrics
  lastSync: number
}
