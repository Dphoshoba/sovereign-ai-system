import { NextResponse } from "next/server"

import { previewControlledTestWriteCleanup } from "../../../../../lib/ontology/semantic-graph-transaction-executor"
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const preview = await previewControlledTestWriteCleanup()

  return NextResponse.json({
    ...preview,
    writesToPrisma: false,
    deletesFromPrisma: false,
  })
}
