import {
  NextRequest,
  NextResponse,
} from "next/server"

import { swarmDistributionAgent } from "../../../../lib/agents/swarm-distribution-agent"

export async function POST(
  req: NextRequest
) {
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
