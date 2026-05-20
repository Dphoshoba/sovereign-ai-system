import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const mission = body.mission as string
    const agentIds = body.agentIds as string[]

    if (!mission || !agentIds || agentIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "mission and agentIds are required" },
        { status: 400 }
      )
    }

    const agents = await prisma.aiAgent.findMany({
      where: {
        id: {
          in: agentIds,
        },
        status: "active",
      },
      include: {
        department: true,
      },
    })

    const orderedAgents = agentIds
      .map((id) => agents.find((agent) => agent.id === id))
      .filter(Boolean)

    if (orderedAgents.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No active agents found" },
        { status: 404 }
      )
    }

    const memoryContext = await getMemoryContext({
      query: mission,
      types: [
        "strategy",
        "voice",
        "audience",
        "publishing",
        "product",
        "ministry",
        "general",
      ],
      limit: 10,
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "mission-chain",
        title: "Mission chain started",
        message: mission,
        status: "running",
        metadata: {
          mission,
          agentIds,
        },
      },
    })

    const steps: {
      agentId: string
      agentName: string
      department: string | null
      role: string
      output: string
    }[] = []

    let previousOutput = ""

    for (const agent of orderedAgents) {
      if (!agent) continue

      const response = await openai.responses.create({
        model: "gpt-5.2",
        instructions:
          `You are ${agent.name}, a specialist agent inside Echoes & Visions. ` +
          `Department: ${agent.department?.name || "General"}. ` +
          `Role: ${agent.role}. ` +
          `Agent Instructions: ${agent.instructions}. ` +
          DAVID_WRITING_DNA +
          " Work as part of a mission chain. Build on previous agent output when available. Be practical and specific.",
        input: `
Main Mission:
${mission}

Saved Memory Context:
${memoryContext}

Previous Agent Output:
${previousOutput || "No previous output. You are the first agent in this chain."}

Your Task:
Complete your part of the mission according to your specialist role.

Return:
1. Your specialist analysis
2. Key recommendations
3. Handoff notes for the next agent
`,
      })

      const output = response.output_text

      steps.push({
        agentId: agent.id,
        agentName: agent.name,
        department: agent.department?.name || null,
        role: agent.role,
        output,
      })

      previousOutput = output
    }

    const finalResponse = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Mission Director for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Synthesize all agent outputs into one clear executive mission report.",
      input: `
Mission:
${mission}

Agent Outputs:
${JSON.stringify(steps)}

Return:
1. Final strategic answer
2. Best recommendations
3. Action plan
4. Risks
5. Next mission suggestion
`,
    })

    const finalReport = finalResponse.output_text

    await prisma.aiActivityEvent.create({
      data: {
        type: "mission-chain",
        title: "Mission chain completed",
        message: finalReport.slice(0, 500),
        status: "success",
        metadata: {
          mission,
          steps,
          finalReport,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      mission,
      steps,
      finalReport,
    })
  } catch (error) {
    console.error("Mission chain failed:", error)

    await prisma.aiActivityEvent.create({
      data: {
        type: "mission-chain",
        title: "Mission chain failed",
        message: error instanceof Error ? error.message : "Unknown failure",
        status: "error",
      },
    })

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Mission chain failed",
      },
      { status: 500 }
    )
  }
}