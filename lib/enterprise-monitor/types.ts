export interface EnterpriseMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: number
}

export interface EnterpriseMonitorMetrics {
  healthScore: number
  uptime: number
  activeServices: number
  criticalAlerts: number
  warningAlerts: number
}

export interface EnterpriseMonitorWorkspace {
  metrics: EnterpriseMetric[]
  status: EnterpriseMonitorMetrics
  lastUpdated: number
}
