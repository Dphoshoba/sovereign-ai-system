import { NextResponse } from "next/server"

import { buildEnterprisePolicyReadiness } from "../../../../lib/enterprise/policy-readiness"

export async function GET() {
  return NextResponse.json(buildEnterprisePolicyReadiness())
}

