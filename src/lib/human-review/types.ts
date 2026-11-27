export interface ReviewItem {
  id: string
  action: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  reviewStatus: 'pending' | 'in_progress' | 'approved' | 'rejected'
  assignedReviewer: string
  createdAt: number
}

export interface HumanReviewMetrics {
  reviewItemCount: number
  approvalRequiredCount: number
  manualDecisionCount: number
  reviewCoverage: number
  operatorConfidence: number
  healthScore: number
}

export interface HumanReview {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  reviews: ReviewItem[]
  metrics: HumanReviewMetrics
  lastSync: number
}
