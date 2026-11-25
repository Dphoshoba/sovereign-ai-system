export type ApprovalState = 'draft' | 'pending_review' | 'approved_preview' | 'blocked' | 'rejected' | 'completed_preview'

export interface ApprovalItem {
  id: string
  title: string
  description: string
  state: ApprovalState
  requiredApprovals: number
  completedApprovals: number
  reviewers: string[]
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  createdAt: number
  lastUpdated: number
}

export interface ApprovalWorkflowMetrics {
  approvalQueueCount: number
  pendingCount: number
  approvedPreviewCount: number
  blockedCount: number
  rejectedCount: number
  humanReviewCoverage: number
  healthScore: number
}

export interface ApprovalWorkflow {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  approvals: ApprovalItem[]
  metrics: ApprovalWorkflowMetrics
  lastSync: number
}
