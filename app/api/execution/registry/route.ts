import { NextResponse } from "next/server"

import { executionLayerRegistry } from "../../../../lib/agents/execution-layer-registry"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    executionLayer: executionLayerRegistry,
  })
}
