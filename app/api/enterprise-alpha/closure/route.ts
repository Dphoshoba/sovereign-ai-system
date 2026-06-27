import { NextResponse } from "next/server"

import { buildEnterpriseAlphaClosureAudit } from "../../../../lib/enterprise/enterprise-alpha-audit"

export async function GET() {
  return NextResponse.json(buildEnterpriseAlphaClosureAudit())
}
