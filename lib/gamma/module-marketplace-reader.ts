import { MODULE_MARKETPLACE_ASSETS } from "../module-marketplace/mock-data"
import type { ModuleMarketplaceWorkspace } from "../module-marketplace/types"

export async function getModuleMarketplaceRegistry(): Promise<ModuleMarketplaceWorkspace> {
  return MODULE_MARKETPLACE_ASSETS
}
