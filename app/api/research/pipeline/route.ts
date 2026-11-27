import { NextResponse } from "next/server"

import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { researchPipelineArchitecture } from "../../../../lib/research/pipeline-registry"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return NextResponse.json({
    ok: true,
    architecture: researchPipelineArchitecture,
  })
}
