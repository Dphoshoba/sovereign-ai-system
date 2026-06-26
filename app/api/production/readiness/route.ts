import { NextResponse } from "next/server"

import { buildProductionReadinessAudit } from "../../../../lib/production/readiness-audit"

export async function GET() {
  return NextResponse.json(buildProductionReadinessAudit())
}
