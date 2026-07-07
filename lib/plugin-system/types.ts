export interface PluginConfig {
  id: string
  name: string
  version: string
  status: "enabled" | "disabled"
  hooks: string[]
}

export interface PluginSystemMetrics {
  totalPlugins: number
  enabledPlugins: number
  failedPlugins: number
  loadTime: number
}

export interface PluginSystemWorkspace {
  plugins: PluginConfig[]
  metrics: PluginSystemMetrics
}
