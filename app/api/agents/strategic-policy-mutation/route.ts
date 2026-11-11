import {
  NextRequest,
  NextResponse,
} from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"

import { strategicPolicyMutationAgent } from "../../../../lib/agents/strategic-policy-mutation-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const memories =
      await prisma.videoPerformanceMemory.findMany({
        orderBy: {
          createdAt: "desc",
        },
      })

    const clustering =
      reinforcementClusteringAgent({
        memories,
      })

    const result =
      strategicPolicyMutationAgent({
        strategicDNA:
          clustering.strategicDNA,
      })

    return NextResponse.json({
      ok: true,
      clustering,
      result,
    })
  } catch (error) {
    console.error(
      "Strategic policy mutation failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Strategic policy mutation failed",
      },
      {
        status: 500,
      }
    )
  }
}
