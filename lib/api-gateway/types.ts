export interface APIEndpoint {
  id: string
  path: string
  method: string
  status: "active" | "deprecated"
  requestsPerSecond: number
  errorRate: number
}

export interface APIGatewayMetrics {
  totalEndpoints: number
  requestsPerSecond: number
  avgLatency: number
  errorRate: number
}

export interface APIGatewayWorkspace {
  endpoints: APIEndpoint[]
  metrics: APIGatewayMetrics
}
