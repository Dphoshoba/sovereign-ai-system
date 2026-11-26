import { API_GATEWAY_ASSETS } from "../api-gateway/mock-data"
import type { APIGatewayWorkspace } from "../api-gateway/types"

export async function getApiGatewayRegistry(): Promise<APIGatewayWorkspace> {
  return API_GATEWAY_ASSETS
}
