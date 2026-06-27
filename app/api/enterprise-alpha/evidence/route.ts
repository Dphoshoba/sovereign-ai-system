import { NextResponse } from "next/server"

import { buildEnterpriseAuditReadiness } from "../../../../lib/enterprise/enterprise-audit-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseAuditReadiness())
}

