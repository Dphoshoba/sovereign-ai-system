import { NextResponse } from "next/server"

import { buildEnterpriseGuardReadinessAudit } from "../../../../lib/enterprise/enterprise-readiness-audit"

export async function GET() {
  return NextResponse.json(buildEnterpriseGuardReadinessAudit())
}

