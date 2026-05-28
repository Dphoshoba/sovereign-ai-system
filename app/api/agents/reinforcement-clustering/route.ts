import {
  NextRequest,
  NextResponse,
} from "next/server"

import { prisma } from "@/lib/prisma"

import { reinforcementClusteringAgent } from "../../../../lib/agents/reinforcement-clustering-agent"

export async function GET() {
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
