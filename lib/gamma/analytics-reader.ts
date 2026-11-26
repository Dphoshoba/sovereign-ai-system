import { ANALYTICS_ASSETS } from "../analytics/mock-data"
import type { AnalyticsWorkspace } from "../analytics/types"

export async function getAnalyticsRegistry(): Promise<AnalyticsWorkspace> {
  return ANALYTICS_ASSETS
}
