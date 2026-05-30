import { NextResponse } from "next/server"

import { executionLayerRegistry } from "../../../../lib/agents/execution-layer-registry"

export async function GET() {
  return NextResponse.json({
    ok: true,
    executionLayer: executionLayerRegistry,
  })
}
