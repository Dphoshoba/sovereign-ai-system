import { NextResponse } from "next/server"

import { buildEnterpriseBetaRehearsalReadiness } from "../../../../lib/enterprise-beta/rehearsal-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaRehearsalReadiness())
}
