import { NextResponse } from "next/server"

import { buildObservabilityMetrics } from "../../../../lib/observability/metrics"

export async function GET() {
  return NextResponse.json(buildObservabilityMetrics())
}
