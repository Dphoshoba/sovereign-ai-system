export type PolicyRule = 'no_external_send' | 'no_auto_publish' | 'no_unapproved_mutation' | 'no_secret_exposure' | 'no_ai_runtime_call' | 'human_approval_required' | 'audit_log_required'

export interface PolicyEnforcement {
  rule: PolicyRule
  status: 'active' | 'warning' | 'enforced'
  violations: number
  description: string
}

export interface SafeExecutionPolicyMetrics {
  policyRuleCount: number
  blockedOperationCount: number
  allowedPreviewCount: number
  safetyScore: number
  complianceScore: number
  healthScore: number
}

export interface SafeExecutionPolicy {
  id: string
  version: string
  status: 'operational' | 'maintenance' | 'degraded'
  policies: PolicyEnforcement[]
  metrics: SafeExecutionPolicyMetrics
  lastSync: number
}
