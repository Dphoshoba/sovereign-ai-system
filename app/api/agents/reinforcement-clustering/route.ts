import {
  NextRequest,
  NextResponse,
} from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"
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

    const result =
      reinforcementClusteringAgent({
        memories,
      })

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error(
      "Reinforcement clustering failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          "Reinforcement clustering failed",
      },
      {
        status: 500,
      }
    )
  }
}
