export type IntegrationName =
  | "github"
  | "google-drive"
  | "gmail"
  | "calendar"
  | "slack"
  | "discord"
  | "notion"
  | "dropbox"
  | "onedrive"

export type IntegrationStatus = "connected" | "disconnected" | "error"

export type Integration = {
  id: string
  name: IntegrationName
  displayName: string
  status: IntegrationStatus
  connected: boolean
  lastSync: number
  syncCount: number
}

export type IntegrationHubMetrics = {
  totalIntegrations: number
  connectedIntegrations: number
  totalSyncs: number
  healthScore: number
}

export type IntegrationHubWorkspace = {
  integrations: Integration[]
  metrics: IntegrationHubMetrics
}
