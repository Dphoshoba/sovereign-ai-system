/**
 * Gmail Hardening Mock Data
 *
 * Deterministic test data for production readiness and health monitoring.
 * All timestamps use BASE_TIME for reproducible test runs.
 * No Date.now(), Math.random(), or temporal side effects.
 */

import type {
  TokenHealth,
  QuotaHealth,
  ScopeHealth,
  RateLimitHealth,
  ConnectionHealth,
  ProductionReadiness,
  OperatorWarning,
  GmailHardeningAggregateHealth,
} from './types';

/**
 * Fixed base timestamp for all deterministic operations
 */
export const BASE_TIME = new Date('2026-07-01T10:00:00Z');

/**
 * Helper: Calculate relative time from BASE_TIME
 */
export function relativeTime(offsetMs: number): Date {
  return new Date(BASE_TIME.getTime() + offsetMs);
}

/**
 * Mock: Healthy token
 */
export const MOCK_TOKEN_HEALTH_HEALTHY: TokenHealth = {
  score: 95,
  status: 'healthy',
  severity: 'low',
  recommendation: 'No action required. Token is valid and will expire in 59 minutes.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  tokenHealthScore: 95,
  refreshRequired: false,
  refreshPossible: true,
  connectionRisk: 5,
};

/**
 * Mock: Token expiring soon
 */
export const MOCK_TOKEN_HEALTH_EXPIRING: TokenHealth = {
  score: 60,
  status: 'degraded',
  severity: 'medium',
  recommendation: 'Token expires in 5 minutes. Refresh immediately to prevent auth failures.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  tokenHealthScore: 60,
  refreshRequired: true,
  refreshPossible: true,
  connectionRisk: 40,
};

/**
 * Mock: Token expired
 */
export const MOCK_TOKEN_HEALTH_EXPIRED: TokenHealth = {
  score: 0,
  status: 'critical',
  severity: 'critical',
  recommendation: 'Token expired. Manual refresh required. No new executions until refreshed.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  tokenHealthScore: 0,
  refreshRequired: true,
  refreshPossible: false,
  connectionRisk: 100,
};

/**
 * Mock: Healthy quota
 */
export const MOCK_QUOTA_HEALTH_HEALTHY: QuotaHealth = {
  readQuota: { limit: 1000, remaining: 950 },
  draftQuota: { limit: 500, remaining: 480 },
  executionQuota: { limit: 250, remaining: 240 },
  retryQuota: { limit: 100, remaining: 95 },
  quotaScore: 95,
  quotaWarning: false,
  quotaExceeded: false,
  status: 'healthy',
  severity: 'low',
  recommendation: 'No quota concerns. All quotas have >90% remaining.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
};

/**
 * Mock: Quota warning
 */
export const MOCK_QUOTA_HEALTH_WARNING: QuotaHealth = {
  readQuota: { limit: 1000, remaining: 100 },
  draftQuota: { limit: 500, remaining: 480 },
  executionQuota: { limit: 250, remaining: 240 },
  retryQuota: { limit: 100, remaining: 95 },
  quotaScore: 50,
  quotaWarning: true,
  quotaExceeded: false,
  status: 'degraded',
  severity: 'medium',
  recommendation: 'Read quota is low (10% remaining). Reduce API calls or consider quota increase.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
};

/**
 * Mock: Quota exceeded
 */
export const MOCK_QUOTA_HEALTH_EXCEEDED: QuotaHealth = {
  readQuota: { limit: 1000, remaining: 0 },
  draftQuota: { limit: 500, remaining: 480 },
  executionQuota: { limit: 250, remaining: 240 },
  retryQuota: { limit: 100, remaining: 95 },
  quotaScore: 0,
  quotaWarning: true,
  quotaExceeded: true,
  status: 'critical',
  severity: 'critical',
  recommendation: 'Read quota exceeded. All read operations blocked. Wait for quota reset or request increase.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
};

/**
 * Mock: All scopes valid
 */
export const MOCK_SCOPE_HEALTH_COMPLETE: ScopeHealth = {
  score: 95,
  status: 'healthy',
  severity: 'low',
  recommendation: 'All required scopes present. No missing scopes.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  scopeCoverage: 100,
  missingScopes: [],
  recommendedScopes: [],
  highRiskScopes: [],
  scopeHealth: 100,
};

/**
 * Mock: Missing critical scope
 */
export const MOCK_SCOPE_HEALTH_MISSING: ScopeHealth = {
  score: 30,
  status: 'critical',
  severity: 'critical',
  recommendation: 'Missing critical scope: gmail.modify. Add scope to enable draft creation.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  scopeCoverage: 66,
  missingScopes: ['gmail.modify'],
  recommendedScopes: [],
  highRiskScopes: [],
  scopeHealth: 66,
};

/**
 * Mock: gmail.send scope present (high risk)
 */
export const MOCK_SCOPE_HEALTH_SEND_ENABLED: ScopeHealth = {
  score: 50,
  status: 'degraded',
  severity: 'high',
  recommendation:
    'gmail.send scope is present but should not be used until Build 140 certification. Consider removing.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  scopeCoverage: 100,
  missingScopes: [],
  recommendedScopes: [],
  highRiskScopes: ['gmail.send'],
  scopeHealth: 50,
};

/**
 * Mock: Normal rate limit
 */
export const MOCK_RATE_LIMIT_NORMAL: RateLimitHealth = {
  score: 100,
  status: 'healthy',
  severity: 'low',
  recommendation: 'Rate limit status normal. No throttling in effect.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  currentRequests: 5,
  remainingRequests: 595,
  windowRemaining: 3600,
  cooldownSeconds: 0,
  rateLimitScore: 100,
  tier: 'Normal',
};

/**
 * Mock: Elevated rate limit
 */
export const MOCK_RATE_LIMIT_ELEVATED: RateLimitHealth = {
  score: 70,
  status: 'degraded',
  severity: 'medium',
  recommendation: 'Rate limit elevated. Reduce request frequency. Limit will reset in 45 minutes.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  currentRequests: 90,
  remainingRequests: 510,
  windowRemaining: 2700,
  cooldownSeconds: 0,
  rateLimitScore: 70,
  tier: 'Elevated',
};

/**
 * Mock: Rate limit warning
 */
export const MOCK_RATE_LIMIT_WARNING: RateLimitHealth = {
  score: 40,
  status: 'degraded',
  severity: 'high',
  recommendation: 'Rate limit critically high. Requests will be throttled. Pause operations immediately.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  currentRequests: 450,
  remainingRequests: 150,
  windowRemaining: 1800,
  cooldownSeconds: 30,
  rateLimitScore: 40,
  tier: 'Warning',
};

/**
 * Mock: Rate limited
 */
export const MOCK_RATE_LIMIT_LIMITED: RateLimitHealth = {
  score: 10,
  status: 'critical',
  severity: 'critical',
  recommendation: 'Rate limit reached. All requests blocked for 5 minutes. No new operations possible.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  currentRequests: 600,
  remainingRequests: 0,
  windowRemaining: 300,
  cooldownSeconds: 300,
  rateLimitScore: 10,
  tier: 'Limited',
};

/**
 * Mock: Healthy connection
 */
export const MOCK_CONNECTION_HEALTH_HEALTHY: ConnectionHealth = {
  score: 95,
  status: 'healthy',
  severity: 'low',
  recommendation: 'Connection is healthy. All systems nominal.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  connectionReadiness: 95,
};

/**
 * Mock: Connection degraded
 */
export const MOCK_CONNECTION_HEALTH_DEGRADED: ConnectionHealth = {
  score: 60,
  status: 'degraded',
  severity: 'medium',
  recommendation: 'Connection degraded. Check network and OAuth configuration.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  connectionReadiness: 60,
};

/**
 * Mock: Production ready
 */
export const MOCK_PRODUCTION_READINESS_READY: ProductionReadiness = {
  score: 90,
  status: 'healthy',
  severity: 'low',
  recommendation: 'Connector is production-ready. Safe to deploy.',
  lastValidated: BASE_TIME,
  healthTrend: 'steady',
  productionReadiness: 90,
};

/**
 * Mock: Production readiness at risk
 */
export const MOCK_PRODUCTION_READINESS_AT_RISK: ProductionReadiness = {
  score: 40,
  status: 'degraded',
  severity: 'high',
  recommendation: 'Connector has issues affecting production readiness. Review warnings before deployment.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  productionReadiness: 40,
};

/**
 * Mock: Not production ready
 */
export const MOCK_PRODUCTION_READINESS_NOT_READY: ProductionReadiness = {
  score: 10,
  status: 'critical',
  severity: 'critical',
  recommendation: 'Connector is not production-ready. Critical issues must be resolved.',
  lastValidated: BASE_TIME,
  healthTrend: 'down',
  productionReadiness: 10,
};

/**
 * Mock: Operator warnings
 */
export const MOCK_OPERATOR_WARNINGS: OperatorWarning[] = [
  {
    id: 'warning_001',
    severity: 'high',
    message: 'OAuth token expires in 5 minutes.',
    recommendedAction: 'Refresh token immediately to prevent auth failures.',
    createdAt: relativeTime(0),
  },
  {
    id: 'warning_002',
    severity: 'medium',
    message: 'Read quota at 10%.',
    recommendedAction: 'Monitor quota usage. Consider raising quota limits if needed.',
    createdAt: relativeTime(-60000),
  },
];

/**
 * Mock: Aggregate health (production ready)
 */
export const MOCK_AGGREGATE_HEALTH_READY: GmailHardeningAggregateHealth = {
  overallHealth: 92,
  productionReadiness: MOCK_PRODUCTION_READINESS_READY,
  connectorHealth: {
    compliance: 95,
    resilience: 90,
    oauth: 90,
    queue: 95,
    approval: 95,
    preview: 92,
    execution: 88,
  },
  operatorWarnings: [],
  recommendedActions: [
    'All systems nominal. No immediate action required.',
    'Continue monitoring rate limits and quotas.',
  ],
  tokenHealth: MOCK_TOKEN_HEALTH_HEALTHY,
  quotaHealth: MOCK_QUOTA_HEALTH_HEALTHY,
  scopeHealth: MOCK_SCOPE_HEALTH_COMPLETE,
  rateLimitHealth: MOCK_RATE_LIMIT_NORMAL,
  connectionHealth: MOCK_CONNECTION_HEALTH_HEALTHY,
};

/**
 * Mock: Aggregate health (at risk)
 */
export const MOCK_AGGREGATE_HEALTH_AT_RISK: GmailHardeningAggregateHealth = {
  overallHealth: 52,
  productionReadiness: MOCK_PRODUCTION_READINESS_AT_RISK,
  connectorHealth: {
    compliance: 80,
    resilience: 70,
    oauth: 50,
    queue: 85,
    approval: 85,
    preview: 80,
    execution: 60,
  },
  operatorWarnings: MOCK_OPERATOR_WARNINGS,
  recommendedActions: [
    'Refresh OAuth token immediately.',
    'Monitor quota usage.',
    'Consider pausing high-volume operations.',
  ],
  tokenHealth: MOCK_TOKEN_HEALTH_EXPIRING,
  quotaHealth: MOCK_QUOTA_HEALTH_WARNING,
  scopeHealth: MOCK_SCOPE_HEALTH_COMPLETE,
  rateLimitHealth: MOCK_RATE_LIMIT_ELEVATED,
  connectionHealth: MOCK_CONNECTION_HEALTH_DEGRADED,
};

/**
 * Mock: Aggregate health (critical)
 */
export const MOCK_AGGREGATE_HEALTH_CRITICAL: GmailHardeningAggregateHealth = {
  overallHealth: 15,
  productionReadiness: MOCK_PRODUCTION_READINESS_NOT_READY,
  connectorHealth: {
    compliance: 50,
    resilience: 30,
    oauth: 0,
    queue: 70,
    approval: 70,
    preview: 60,
    execution: 20,
  },
  operatorWarnings: [
    {
      id: 'critical_001',
      severity: 'critical',
      message: 'OAuth token expired. No authentication possible.',
      recommendedAction: 'Refresh token or re-authenticate immediately.',
      createdAt: BASE_TIME,
    },
    {
      id: 'critical_002',
      severity: 'critical',
      message: 'Read quota exceeded. All read operations blocked.',
      recommendedAction: 'Wait for quota reset or request emergency quota increase.',
      createdAt: relativeTime(-120000),
    },
    {
      id: 'critical_003',
      severity: 'critical',
      message: 'Missing critical scope: gmail.modify.',
      recommendedAction: 'Re-authenticate with proper scopes.',
      createdAt: relativeTime(-300000),
    },
  ],
  recommendedActions: [
    'CRITICAL: Connector is not production-ready.',
    'Multiple critical issues must be resolved.',
    'Do not deploy or execute until all warnings cleared.',
  ],
  tokenHealth: MOCK_TOKEN_HEALTH_EXPIRED,
  quotaHealth: MOCK_QUOTA_HEALTH_EXCEEDED,
  scopeHealth: MOCK_SCOPE_HEALTH_MISSING,
  rateLimitHealth: MOCK_RATE_LIMIT_LIMITED,
  connectionHealth: MOCK_CONNECTION_HEALTH_DEGRADED,
};
