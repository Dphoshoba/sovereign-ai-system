import { REGISTRY_ASSETS } from "../registry/mock-data"
import type { RegistryWorkspace } from "../registry/types"

export async function getRegistryRegistry(): Promise<RegistryWorkspace> {
  return REGISTRY_ASSETS
}
