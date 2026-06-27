import { NextResponse } from "next/server"

import { buildEnterpriseApprovalReadiness } from "../../../../lib/enterprise/approval-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseApprovalReadiness())
}

