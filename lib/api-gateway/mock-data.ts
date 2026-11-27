import type { APIGatewayWorkspace } from "./types"

export const API_GATEWAY_ASSETS: APIGatewayWorkspace = {
  endpoints: [
    {
      id: "api-001",
      path: "/api/v1/users",
      method: "GET",
      status: "active",
      requestsPerSecond: 150,
      errorRate: 0.1,
    },
    {
      id: "api-002",
      path: "/api/v1/data",
      method: "POST",
      status: "active",
      requestsPerSecond: 80,
      errorRate: 0.05,
    },
  ],
  metrics: {
    totalEndpoints: 2,
    requestsPerSecond: 230,
    avgLatency: 125,
    errorRate: 0.075,
  },
}
