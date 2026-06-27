import { NextResponse } from "next/server"

import { buildEnterpriseBetaUsageGovernance } from "../../../../lib/enterprise-beta/usage-governance"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaUsageGovernance())
}
