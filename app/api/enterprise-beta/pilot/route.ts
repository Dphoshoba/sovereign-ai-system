import { NextResponse } from "next/server"

import { buildEnterpriseBetaPilotReadiness } from "../../../../lib/enterprise-beta/pilot-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaPilotReadiness())
}
