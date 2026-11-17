import {
  NextRequest,
  NextResponse,
} from "next/server"

import { swarmDistributionAgent } from "../../../../lib/agents/swarm-distribution-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(
  req: NextRequest
) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await req.json()

    const result =
      swarmDistributionAgent({
        topic:
          body.topic ||
          "The Rise of Autonomous AI Agents",
      })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error(
      "Swarm distribution failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Swarm distribution failed",
      },
      {
        status: 500,
      }
    )
  }
}
