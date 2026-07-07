import type { PluginSystemWorkspace } from "./types"

export const PLUGIN_SYSTEM_ASSETS: PluginSystemWorkspace = {
  plugins: [
    {
      id: "plugin-001",
      name: "Analytics Plugin",
      version: "1.2.0",
      status: "enabled",
      hooks: ["onEvent", "onMetric"],
    },
    {
      id: "plugin-002",
      name: "Notification Plugin",
      version: "2.0.1",
      status: "enabled",
      hooks: ["onAlert"],
    },
  ],
  metrics: {
    totalPlugins: 2,
    enabledPlugins: 2,
    failedPlugins: 0,
    loadTime: 245,
  },
}
