import { NextResponse } from "next/server"

import { agentRegistry } from "../../../../lib/agents/agent-registry"

export async function GET() {
  return NextResponse.json({
    ok: true,
    registry: agentRegistry,
  })
}
