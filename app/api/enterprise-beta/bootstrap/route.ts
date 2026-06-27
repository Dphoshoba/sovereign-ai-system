import { NextResponse } from "next/server"

import { buildEnterpriseBetaRolloutReadiness } from "../../../../lib/enterprise-beta/rollout-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaRolloutReadiness())
}
