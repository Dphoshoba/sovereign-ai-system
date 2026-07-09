export type HealthStatus = 'healthy' | 'degraded' | 'critical'

export type HealthSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BaseHealthModel {
  score: number // 0-100
  status: HealthStatus
  severity: HealthSeverity
  recommendation: string
  lastValidated: Date
  healthTrend: 'up' | 'steady' | 'down'
}

export interface TokenHealth extends BaseHealthModel {
  tokenHealthScore: number
  refreshRequired: boolean
  refreshPossible: boolean
  connectionRisk: number // 0-100
}

export interface QuotaHealth {
  readQuota: { limit: number; remaining: number }
  draftQuota: { limit: number; remaining: number }
  executionQuota: { limit: number; remaining: number }
  retryQuota: { limit: number; remaining: number }

  quotaScore: number // 0-100
  quotaWarning: boolean
  quotaExceeded: boolean
  status: HealthStatus
  severity: HealthSeverity
  recommendation: string
  lastValidated: Date
  healthTrend: 'up' | 'steady' | 'down'
}

export type ScopeRisk = 'low' | 'medium' | 'high'

export interface ScopeHealth extends BaseHealthModel {
  scopeCoverage: number // 0-100
  missingScopes: string[]
  recommendedScopes: string[]
  highRiskScopes: string[]
  scopeHealth: number // 0-100
}

export type RateLimitTier = 'Normal' | 'Elevated' | 'Warning' | 'Limited' | 'Cooldown'

export interface RateLimitHealth extends BaseHealthModel {
  currentRequests: number
  remainingRequests: number
  windowRemaining: number // seconds
  cooldownSeconds: number
  rateLimitScore: number // 0-100
  tier: RateLimitTier
}

export interface ConnectionHealth extends BaseHealthModel {
  // For now keep generic; Build 139 uses deterministic mock values.
  connectionReadiness: number // 0-100
}

export interface ProductionReadiness extends BaseHealthModel {
  productionReadiness: number // 0-100
}

export interface OperatorWarning {
  id: string
  severity: HealthSeverity
  message: string // operator-readable
  recommendedAction: string // operator action
  createdAt: Date
}

export interface GmailHardeningAggregateHealth {
  overallHealth: number // 0-100
  productionReadiness: ProductionReadiness
  connectorHealth: {
    compliance: number
    resilience: number
    oauth: number
    queue: number
    approval: number
    preview: number
    execution: number
  }
  operatorWarnings: OperatorWarning[]
  recommendedActions: string[]

  tokenHealth: TokenHealth
  quotaHealth: QuotaHealth
  scopeHealth: ScopeHealth
  rateLimitHealth: RateLimitHealth
  connectionHealth: ConnectionHealth
}

