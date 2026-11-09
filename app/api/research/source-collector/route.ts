import { NextRequest, NextResponse } from "next/server"

import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import {
  sourceCollector,
  type SourceRecord,
} from "../../../../lib/research/source-collector"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const manualSources: SourceRecord[] =
    Array.isArray(body.manualSources)
      ? body.manualSources
      : []

  const result = await sourceCollector(
    body.topic || "The Future of AI and Faith",
    manualSources
  )

  return NextResponse.json({
    ok: true,
    result,
  })
}
