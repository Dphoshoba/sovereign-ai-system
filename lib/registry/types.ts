export interface RegistryEntry {
  id: string
  name: string
  type: string
  version: string
  status: "active" | "deprecated" | "pending"
  dependencies: string[]
}

export interface RegistryMetrics {
  totalEntries: number
  activeServices: number
  registrationRate: number
  failureRate: number
}

export interface RegistryWorkspace {
  entries: RegistryEntry[]
  metrics: RegistryMetrics
  lastSync: number
}
