import { NextResponse } from "next/server"

import { buildEnterpriseBetaIdentityReadiness } from "../../../../lib/enterprise-beta/identity-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaIdentityReadiness())
}
