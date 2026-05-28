import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { strategyEvolutionAgent } from "../../../../lib/agents/strategy-evolution-agent"

import { promptMutationAgent } from "../../../../lib/agents/prompt-mutation-agent"

export async function GET() {
  try {
    const memories = await prisma.videoPerformanceMemory.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    const evolution = strategyEvolutionAgent(memories)

    const mutations = promptMutationAgent(evolution)

    return NextResponse.json({
      ok: true,
      evolution,
      mutations,
    })
  } catch (error) {
    console.error("Prompt mutation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Prompt mutation failed",
      },
      {
        status: 500,
      }
    )
  }
}