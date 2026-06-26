import { NextResponse } from "next/server"

import { buildProductionEnablementReadiness } from "../../../../lib/enablement/release-path"

export async function GET() {
  return NextResponse.json(buildProductionEnablementReadiness())
}
