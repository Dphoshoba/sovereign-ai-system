import { AI_MARKETPLACE_ASSETS } from "../ai-marketplace/mock-data"
import type { AIMarketplaceWorkspace } from "../ai-marketplace/types"

export async function getAiMarketplaceRegistry(): Promise<AIMarketplaceWorkspace> {
  return AI_MARKETPLACE_ASSETS
}
