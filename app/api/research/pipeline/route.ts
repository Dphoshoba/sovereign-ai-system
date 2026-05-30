import { NextResponse } from "next/server"

import { researchPipelineArchitecture } from "../../../../lib/research/pipeline-registry"

export async function GET() {
  return NextResponse.json({
    ok: true,
    architecture: researchPipelineArchitecture,
  })
}
