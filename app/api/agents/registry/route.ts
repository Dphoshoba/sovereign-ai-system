import { NextResponse } from "next/server"

import { agentRegistry } from "../../../../lib/agents/agent-registry"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    registry: agentRegistry,
  })
}
