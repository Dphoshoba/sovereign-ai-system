import { NextResponse } from "next/server"

import { buildEnterpriseBetaSessionCheckpointReadiness } from "../../../../lib/enterprise-beta/auth-checkpoint"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaSessionCheckpointReadiness())
}
