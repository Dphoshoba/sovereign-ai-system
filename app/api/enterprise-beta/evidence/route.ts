import { NextResponse } from "next/server"

import { buildEnterpriseBetaDecisionReadiness } from "../../../../lib/enterprise-beta/decision-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaDecisionReadiness())
}
