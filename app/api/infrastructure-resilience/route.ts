import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Infrastructure resilience system temporarily disabled during production stabilization.",
    checks: [],
    incidents: [],
    policies: [],
    retryJobs: [],
    runs: [],
  })
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    ok: true,
    message:
      "Infrastructure resilience execution temporarily disabled during production stabilization.",
    healthChecks: [],
  })
}