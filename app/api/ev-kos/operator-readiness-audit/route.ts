import { NextResponse } from "next/server"

import { buildOperatorReadinessAudit } from "../../../../lib/ev-kos/operator-readiness-audit"

export async function GET() {
  return NextResponse.json(buildOperatorReadinessAudit())
}
