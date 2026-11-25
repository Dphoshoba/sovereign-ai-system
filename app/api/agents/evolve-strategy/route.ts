import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { strategyEvolutionAgent } from "../../../../lib/agents/strategy-evolution-agent"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const memories = await prisma.videoPerformanceMemory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    const evolution = strategyEvolutionAgent(memories)

    return NextResponse.json({
      ok: true,
      totalMemories: memories.length,
      evolution,
    })
  } catch (error) {
    console.error("Strategy evolution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Strategy evolution failed",
      },
      {
        status: 500,
      }
    )
  }
}