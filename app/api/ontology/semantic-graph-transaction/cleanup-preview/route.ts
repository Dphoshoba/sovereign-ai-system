import { NextResponse } from "next/server"

import { previewControlledTestWriteCleanup } from "../../../../../lib/ontology/semantic-graph-transaction-executor"

export async function GET() {
  const preview = await previewControlledTestWriteCleanup()

  return NextResponse.json({
    ...preview,
    writesToPrisma: false,
    deletesFromPrisma: false,
  })
}
