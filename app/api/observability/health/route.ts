import { NextResponse } from "next/server"

import { buildSystemHealth } from "../../../../lib/observability/system-health"

export async function GET() {
  return NextResponse.json(buildSystemHealth())
}
