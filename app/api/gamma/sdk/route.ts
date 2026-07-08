import { getSdkGeneratorRegistry } from "../../../../lib/gamma/sdk-generator-reader"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const registry = await getSdkGeneratorRegistry()

  const response = {
    sdks: registry.sdks.length,
    metrics: registry.metrics,
    timestamp: 1751990400000,
  }

  return Response.json(response, { status: 200 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = {
      status: "generating",
      language: body.language || "typescript",
      version: body.version || "1.0.0",
      timestamp: 1751990400000,
      estimatedTime: "5000ms",
      sdkId: `sdk-${Math.random().toString(36).substring(7)}`,
    }

    return Response.json(response, { status: 202 })
  } catch (error) {
    return Response.json(
      { error: "Invalid SDK request" },
      { status: 400 }
    )
  }
}
