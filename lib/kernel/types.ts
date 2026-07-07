export interface KernelEngine {
  id: string
  name: string
  status: "active" | "inactive" | "maintenance"
  cpuUsage: number
  memoryUsage: number
  uptimeHours: number
}

export interface KernelMetrics {
  totalEngines: number
  activeEngines: number
  cpuLoad: number
  memoryUsed: number
  requestsPerSecond: number
  errorRate: number
  avgResponseTime: number
}

export interface KernelWorkspace {
  engines: KernelEngine[]
  metrics: KernelMetrics
  uptime: number
  version: string
}
