import { NextResponse } from "next/server"

import { buildOperatorActionDashboard } from "../../../../lib/ev-kos/operator-action-preview"

export async function GET() {
  return NextResponse.json(buildOperatorActionDashboard())
}
