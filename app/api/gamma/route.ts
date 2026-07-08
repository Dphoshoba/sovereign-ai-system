import { getApiGatewayRegistry } from "../../../lib/gamma/api-gateway-reader"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const registry = await getApiGatewayRegistry()

  const response = {
    endpoints: registry.endpoints.length,
    metrics: registry.metrics,
    timestamp: 1751990400000,
  }

  return Response.json(response, { status: 200 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = {
      status: "accepted",
      endpoint: body.endpoint || "unknown",
      method: body.method || "POST",
      timestamp: 1751990400000,
      requestId: `req-${Math.random().toString(36).substring(7)}`,
    }

    return Response.json(response, { status: 202 })
  } catch (error) {
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
