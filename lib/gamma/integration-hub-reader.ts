import { INTEGRATION_HUB_ASSETS } from "../integration-hub/mock-data"
import type { IntegrationHubWorkspace } from "../integration-hub/types"

export async function getIntegrationHubRegistry(): Promise<IntegrationHubWorkspace> {
  return INTEGRATION_HUB_ASSETS
}
