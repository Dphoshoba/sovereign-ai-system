import type { EnterpriseMonitorWorkspace } from "./types"

export const ENTERPRISE_MONITOR_ASSETS: EnterpriseMonitorWorkspace = {
  metrics: [
    {
      id: "metric-001",
      name: "CPU Usage",
      value: 52,
      unit: "%",
      timestamp: 1751990400000,
    },
    {
      id: "metric-002",
      name: "Memory Usage",
      value: 68,
      unit: "%",
      timestamp: 1751990400000,
    },
    {
      id: "metric-003",
      name: "Request Latency",
      value: 142,
      unit: "ms",
      timestamp: 1751990400000,
    },
  ],
  status: {
    healthScore: 92,
    uptime: 99.85,
    activeServices: 12,
    criticalAlerts: 0,
    warningAlerts: 2,
  },
  lastUpdated: 1751990400000,
}
