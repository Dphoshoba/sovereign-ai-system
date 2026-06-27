import { NextResponse } from "next/server"

import { buildEnterpriseBetaPersistenceReadiness } from "../../../../lib/enterprise-beta/storage-readiness"

export async function GET() {
  return NextResponse.json(buildEnterpriseBetaPersistenceReadiness())
}
