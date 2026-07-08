import { SafeExecutionPolicy, PolicyEnforcement } from './types'

const FIXED_TIMESTAMP = 1751990400000

const policies: PolicyEnforcement[] = [
  { rule: 'no_external_send', status: 'enforced', violations: 0, description: 'Prevent sending messages to external systems without approval' },
  { rule: 'no_auto_publish', status: 'enforced', violations: 2, description: 'Require manual approval for any publish operation' },
  { rule: 'no_unapproved_mutation', status: 'active', violations: 0, description: 'Block mutations without explicit human approval' },
  { rule: 'no_secret_exposure', status: 'enforced', violations: 0, description: 'Prevent exposure of credentials in logs or outputs' },
  { rule: 'no_ai_runtime_call', status: 'active', violations: 0, description: 'Block AI provider calls during runtime execution' },
  { rule: 'human_approval_required', status: 'enforced', violations: 1, description: 'Require human approval for all critical operations' },
  { rule: 'audit_log_required', status: 'active', violations: 0, description: 'Log all operations to audit trail' },
]

export const getSafeExecutionPolicyMockData = (): SafeExecutionPolicy => ({
  id: 'safe-execution-policy-001',
  version: '1.0.0',
  status: 'operational',
  policies,
  metrics: {
    policyRuleCount: policies.length,
    blockedOperationCount: 3,
    allowedPreviewCount: 156,
    safetyScore: 97,
    complianceScore: 95,
    healthScore: 96,
  },
  lastSync: FIXED_TIMESTAMP,
})
