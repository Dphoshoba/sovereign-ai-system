import type { PluginConfig } from "./types"

export interface Plugin {
  id: string
  name: string
  version: string
  enabled: boolean
  config: Record<string, any>
  execute?: (context: any) => Promise<any>
}

export class PluginLoader {
  private plugins: Map<string, Plugin> = new Map()
  private loadedCount = 0

  async loadPlugin(config: PluginConfig): Promise<void> {
    const plugin: Plugin = {
      id: config.id,
      name: config.name,
      version: config.version,
      enabled: config.enabled,
      config: config.config,
    }

    this.plugins.set(config.id, plugin)
    if (config.enabled) {
      this.loadedCount++
    }
  }

  async unloadPlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    if (plugin.enabled) {
      this.loadedCount--
    }

    return this.plugins.delete(id)
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id)
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getActivePlugins(): Plugin[] {
    return this.getPlugins().filter((p) => p.enabled)
  }

  enablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    if (!plugin.enabled) {
      plugin.enabled = true
      this.loadedCount++
    }

    return true
  }

  disablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    if (plugin.enabled) {
      plugin.enabled = false
      this.loadedCount--
    }

    return true
  }

  getLoadedPluginsCount(): number {
    return this.loadedCount
  }

  async executePlugin(id: string, context: any): Promise<any> {
    const plugin = this.plugins.get(id)
    if (!plugin || !plugin.enabled) {
      throw new Error(`Plugin ${id} not found or not enabled`)
    }

    if (plugin.execute) {
      return await plugin.execute(context)
    }

    return null
  }
}
