import { PLUGIN_SYSTEM_ASSETS } from "../plugin-system/mock-data"
import type { PluginSystemWorkspace } from "../plugin-system/types"

export async function getPluginSystemRegistry(): Promise<PluginSystemWorkspace> {
  return PLUGIN_SYSTEM_ASSETS
}
