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
    const command = body.command as string

    if (!command) {
      return NextResponse.json(
        { ok: false, error: "Command is required" },
        { status: 400 }
      )
    }

    const [articles, clients, revenue, agents, memories] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.clientProfile.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.revenueRecord.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.aiAgent.findMany({ include: { department: true }, take: 30 }),
      prisma.aiMemory.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    ])

    const memoryContext = await getMemoryContext({
      query: command,
      types: ["strategy", "voice", "audience", "publishing", "product", "ministry", "general"],
      limit: 10,
    })

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the conversational operations layer for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Interpret the user command and respond like an executive operations assistant. " +
        "Do not execute destructive actions. Recommend safe next steps. Be clear and practical.",
      input: `
Command:
${command}

Relevant Memory:
${memoryContext}

Current Articles:
${JSON.stringify(
  articles.map((a) => ({
    title: a.title,
    status: a.status,
    category: a.category,
  }))
)}

Clients:
${JSON.stringify(
  clients.map((c) => ({
    name: c.name,
    status: c.status,
    type: c.type,
    interests: c.interests,
  }))
)}

Revenue:
${JSON.stringify(
  revenue.map((r) => ({
    source: r.source,
    category: r.category,
    amount: r.amount,
    recurring: r.recurring,
  }))
)}

Agents:
${JSON.stringify(
  agents.map((a) => ({
    name: a.name,
    department: a.department?.name,
    role: a.role,
  }))
)}

Stored Memories:
${JSON.stringify(
  memories.map((m) => ({
    type: m.type,
    title: m.title,
    tags: m.tags,
  }))
)}

Return:
1. Direct response
2. Best next action
3. Suggested agent or system to use
4. Any warning or approval needed
`,
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "conversation-ops",
        title: "Conversational command processed",
        message: command,
        status: "success",
        metadata: {
          command,
          response: response.output_text,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      answer: response.output_text,
    })
  } catch (error) {
    console.error("Conversation ops failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Conversation ops failed",
      },
      { status: 500 }
    )
  }
}