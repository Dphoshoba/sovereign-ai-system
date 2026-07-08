import type { IntegrationHubWorkspace } from "./types"

const FIXED_TIMESTAMP = 1751990400000

export const INTEGRATION_HUB_ASSETS: IntegrationHubWorkspace = {
  integrations: [
    { id: "int-github", name: "github", displayName: "GitHub", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 1840 },
    { id: "int-gdrive", name: "google-drive", displayName: "Google Drive", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 2340 },
    { id: "int-gmail", name: "gmail", displayName: "Gmail", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 5420 },
    { id: "int-cal", name: "calendar", displayName: "Google Calendar", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 3180 },
    { id: "int-slack", name: "slack", displayName: "Slack", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 8920 },
    { id: "int-discord", name: "discord", displayName: "Discord", status: "disconnected", connected: false, lastSync: FIXED_TIMESTAMP, syncCount: 0 },
    { id: "int-notion", name: "notion", displayName: "Notion", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 1250 },
    { id: "int-dropbox", name: "dropbox", displayName: "Dropbox", status: "disconnected", connected: false, lastSync: FIXED_TIMESTAMP, syncCount: 0 },
    { id: "int-onedrive", name: "onedrive", displayName: "OneDrive", status: "connected", connected: true, lastSync: FIXED_TIMESTAMP, syncCount: 945 },
  ],
  metrics: {
    totalIntegrations: 9,
    connectedIntegrations: 7,
    totalSyncs: 23895,
    healthScore: 88,
  },
}
