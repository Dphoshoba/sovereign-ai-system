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

    const agentId = body.agentId as string
    const mission = body.mission as string

    if (!agentId || !mission) {
      return NextResponse.json(
        { ok: false, error: "agentId and mission are required" },
        { status: 400 }
      )
    }

    const agent = await prisma.aiAgent.findUnique({
      where: { id: agentId },
      include: { department: true },
    })

    if (!agent) {
      return NextResponse.json(
        { ok: false, error: "Agent not found" },
        { status: 404 }
      )
    }

    const memoryContext = await getMemoryContext({
      query: mission,
      types: ["strategy", "voice", "audience", "publishing", "product", "ministry", "general"],
      limit: 10,
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "agent-runtime",
        title: `Agent mission started: ${agent.name}`,
        message: mission,
        status: "running",
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          department: agent.department?.name || null,
        },
      },
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        `You are ${agent.name}, a specialist agent inside Echoes & Visions. ` +
        `Department: ${agent.department?.name || "General"}. ` +
        `Role: ${agent.role}. ` +
        `Agent Instructions: ${agent.instructions}. ` +
        DAVID_WRITING_DNA +
        " Use the saved memory context when relevant. Be practical, clear and actionable.",
      input: `
Mission:
${mission}

Saved memory context:
${memoryContext}

Return:
1. Direct answer
2. Recommended next actions
3. Risks or cautions
4. Follow-up task suggestion
`,
    })

    const output = response.output_text

    await prisma.aiActivityEvent.create({
      data: {
        type: "agent-runtime",
        title: `Agent mission completed: ${agent.name}`,
        message: output.slice(0, 500),
        status: "success",
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          mission,
          output,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      agent: {
        id: agent.id,
        name: agent.name,
        department: agent.department?.name || null,
        role: agent.role,
      },
      output,
    })
  } catch (error) {
    console.error("Agent runtime failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Agent runtime failed",
      },
      { status: 500 }
    )
  }
}