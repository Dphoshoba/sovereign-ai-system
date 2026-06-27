import { NextResponse } from "next/server"

import { buildEnterpriseReleaseReadiness } from "../../../../lib/enterprise/release-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseReleaseReadiness())
}

