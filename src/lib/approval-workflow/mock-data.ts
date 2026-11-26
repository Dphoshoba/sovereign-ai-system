import { ApprovalWorkflow, ApprovalItem } from './types'

const FIXED_TIMESTAMP = 1751990400000

const approvals: ApprovalItem[] = [
  {
    id: 'app-001',
    title: 'Email to Executive Team',
    description: 'Send quarterly briefing email',
    state: 'pending_review',
    requiredApprovals: 2,
    completedApprovals: 1,
    reviewers: ['Reviewer A', 'Reviewer B'],
    riskLevel: 'critical',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-002',
    title: 'Create Project Plan',
    description: 'Generate Q3 execution plan',
    state: 'approved_preview',
    requiredApprovals: 1,
    completedApprovals: 1,
    reviewers: ['Reviewer C'],
    riskLevel: 'high',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-003',
    title: 'Social Media Post',
    description: 'Schedule LinkedIn announcement',
    state: 'draft',
    requiredApprovals: 1,
    completedApprovals: 0,
    reviewers: ['Marketing Lead'],
    riskLevel: 'medium',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-004',
    title: 'Calendar Event Block',
    description: 'Reserve time for team meeting',
    state: 'completed_preview',
    requiredApprovals: 1,
    completedApprovals: 1,
    reviewers: ['Manager'],
    riskLevel: 'low',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-005',
    title: 'Document Creation',
    description: 'Generate company policy document',
    state: 'blocked',
    requiredApprovals: 3,
    completedApprovals: 1,
    reviewers: ['Legal', 'Compliance', 'Manager'],
    riskLevel: 'critical',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-006',
    title: 'Task Assignment',
    description: 'Create task for Q3 initiative',
    state: 'approved_preview',
    requiredApprovals: 1,
    completedApprovals: 1,
    reviewers: ['Lead'],
    riskLevel: 'low',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-007',
    title: 'Report Generation',
    description: 'Create monthly analytics report',
    state: 'pending_review',
    requiredApprovals: 2,
    completedApprovals: 0,
    reviewers: ['Analyst', 'Manager'],
    riskLevel: 'medium',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
  {
    id: 'app-008',
    title: 'Email Draft - Customer Notice',
    description: 'Communicate service update',
    state: 'rejected',
    requiredApprovals: 2,
    completedApprovals: 1,
    reviewers: ['Communications', 'Legal'],
    riskLevel: 'critical',
    createdAt: FIXED_TIMESTAMP,
    lastUpdated: FIXED_TIMESTAMP,
  },
]

export const getApprovalWorkflowMockData = (): ApprovalWorkflow => {
  const pendingCount = approvals.filter(a => a.state === 'pending_review').length
  const approvedCount = approvals.filter(a => a.state === 'approved_preview').length
  const blockedCount = approvals.filter(a => a.state === 'blocked').length
  const rejectedCount = approvals.filter(a => a.state === 'rejected').length

  return {
    id: 'approval-workflow-001',
    version: '1.0.0',
    status: 'operational',
    approvals,
    metrics: {
      approvalQueueCount: approvals.length,
      pendingCount,
      approvedPreviewCount: approvedCount,
      blockedCount,
      rejectedCount,
      humanReviewCoverage: 88,
      healthScore: 90,
    },
    lastSync: FIXED_TIMESTAMP,
  }
}
