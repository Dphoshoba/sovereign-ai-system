import { NextResponse } from "next/server"

import { buildEnterpriseBetaGuardReadiness } from "../../../../lib/enterprise-beta/guard-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaGuardReadiness())
}
