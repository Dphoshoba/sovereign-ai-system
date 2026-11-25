import { HumanReview, ReviewItem } from './types'

const FIXED_TIMESTAMP = 1751990400000

const reviews: ReviewItem[] = [
  { id: 'hr-001', action: 'Email to Executive', priority: 'critical', reviewStatus: 'in_progress', assignedReviewer: 'Reviewer A', createdAt: FIXED_TIMESTAMP },
  { id: 'hr-002', action: 'Document Creation', priority: 'high', reviewStatus: 'pending', assignedReviewer: 'Legal Lead', createdAt: FIXED_TIMESTAMP },
  { id: 'hr-003', action: 'Social Post', priority: 'medium', reviewStatus: 'approved', assignedReviewer: 'Brand Manager', createdAt: FIXED_TIMESTAMP },
  { id: 'hr-004', action: 'Plan Synthesis', priority: 'critical', reviewStatus: 'pending', assignedReviewer: 'Operations Lead', createdAt: FIXED_TIMESTAMP },
  { id: 'hr-005', action: 'Report Generation', priority: 'low', reviewStatus: 'approved', assignedReviewer: 'Analytics Lead', createdAt: FIXED_TIMESTAMP },
]

export const getHumanReviewMockData = (): HumanReview => ({
  id: 'human-review-001',
  version: '1.0.0',
  status: 'operational',
  reviews,
  metrics: {
    reviewItemCount: reviews.length,
    approvalRequiredCount: reviews.filter(r => r.reviewStatus === 'pending').length,
    manualDecisionCount: reviews.filter(r => r.reviewStatus !== 'pending').length,
    reviewCoverage: 92,
    operatorConfidence: 89,
    healthScore: 90,
  },
  lastSync: FIXED_TIMESTAMP,
})
