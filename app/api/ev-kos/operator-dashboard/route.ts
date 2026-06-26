import { NextResponse } from "next/server"

import { buildEVKOSOperatorDashboard } from "../../../../lib/ev-kos/operator-dashboard"

export async function GET() {
  return NextResponse.json(buildEVKOSOperatorDashboard())
}
