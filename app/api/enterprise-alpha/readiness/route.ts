import { NextResponse } from "next/server"

import {
  buildEnterpriseAlphaReadiness,
  summarizeEnterpriseAlphaReadiness,
} from "../../../../lib/enterprise/enterprise-readiness"

export async function GET() {
  const readiness = buildEnterpriseAlphaReadiness()

  return NextResponse.json({
    ...readiness,
    summary: summarizeEnterpriseAlphaReadiness(readiness),
  })
}

