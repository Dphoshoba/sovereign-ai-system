import { NextResponse } from "next/server"

import { buildEnterpriseBetaAuthDryRunReadiness } from "../../../../lib/enterprise-beta/auth-dry-run-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaAuthDryRunReadiness())
}
