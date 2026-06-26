import { NextResponse } from "next/server"

import { buildDeploymentReadiness } from "../../../../lib/production/deployment-readiness"

export async function GET() {
  return NextResponse.json(buildDeploymentReadiness())
}
