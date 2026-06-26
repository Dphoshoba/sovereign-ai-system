import { NextResponse } from "next/server"

import { buildSecurityAudit } from "../../../../lib/production/security-audit"

export async function GET() {
  return NextResponse.json(buildSecurityAudit())
}
