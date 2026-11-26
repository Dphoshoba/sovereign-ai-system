export interface EngineMetadata {
  id: string
  name: string
  version: string
  status: "healthy" | "degraded" | "unhealthy"
  dependencies: string[]
  readyAt: number
  healthScore: number
}

export interface RegistryEntry {
  id: string
  engine: EngineMetadata
  reader: (slug: string) => Promise<any>
  registry: () => Promise<any>
}

export interface EventPayload {
  id: string
  timestamp: number
  source: string
  type: string
  data: Record<string, any>
}

export interface WorkflowStep {
  engineId: string
  action: string
  timeout: number
  retryCount: number
}

export interface WorkflowDefinition {
  id: string
  name: string
  steps: WorkflowStep[]
  parallelizable: boolean
}

export interface ScheduleConfig {
  engineId: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual"
  lastRun: number
  nextRun: number
}

export interface MetricSnapshot {
  timestamp: number
  engineId: string
  healthScore: number
  responseTime: number
  errorRate: number
  throughput: number
}

export interface CacheEntry<T> {
  key: string
  value: T
  createdAt: number
  expiresAt: number
  ttl: number
}

export interface PermissionLevel {
  role: "founder" | "ceo" | "executive" | "editor" | "researcher" | "viewer" | "client" | "public"
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canManage: boolean
}

export interface PluginConfig {
  id: string
  name: string
  version: string
  enabled: boolean
  config: Record<string, any>
}

export interface SDKConfig {
  language: "typescript" | "python" | "rest"
  baseUrl: string
  version: string
  engines: EngineMetadata[]
}
