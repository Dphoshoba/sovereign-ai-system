import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const scenario = body.scenario as string

    if (!scenario) {
      return NextResponse.json(
        { ok: false, error: "Scenario is required" },
        { status: 400 }
      )
    }

    const [
      articles,
      clients,
      revenueRecords,
      memories,
      agents,
      workflows,
      graphNodes,
      graphEdges,
    ] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.clientProfile.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.revenueRecord.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.aiMemory.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.aiAgent.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { department: true },
      }),
      prisma.aiWorkflow.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.knowledgeNode.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.knowledgeEdge.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ])

    const memoryContext = await getMemoryContext({
      query: scenario,
      types: ["strategy", "audience", "product", "publishing", "ministry", "general"],
      limit: 12,
    })

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the AI Simulation and Strategic Scenario Planning Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Think like a strategic war-room advisor, CFO, product architect, ministry strategist, growth operator and risk analyst. Return only valid JSON. No markdown.",
      input:
        "Run a strategic simulation for this scenario:\n" +
        scenario +
        "\n\nUse the available platform data. Do not invent hard analytics. You may make clearly reasoned projections, but keep them practical and label them as estimates. " +
        "Return JSON only in this exact format: " +
        `{
          "scenarioSummary":"...",
          "baseAssumptions":["..."],
          "upsideOpportunities":["..."],
          "majorRisks":["..."],
          "likelyOutcomes":[{"timeframe":"30 days","outcome":"...","confidence":"low|medium|high"}],
          "revenueImplications":["..."],
          "contentImplications":["..."],
          "crmImplications":["..."],
          "agentAndWorkflowRecommendations":["..."],
          "recommendedActions":[{"priority":"high","action":"...","reason":"..."}],
          "decision":"go|pause|test-first|revise",
          "executiveRecommendation":"..."
        }` +
        "\n\nRelevant Memory Context:\n" +
        memoryContext +
        "\n\nArticles:\n" +
        JSON.stringify(
          articles.map((a) => ({
            title: a.title,
            category: a.category,
            status: a.status,
            excerpt: a.excerpt,
            seoKeywords: a.seoKeywords,
          }))
        ) +
        "\n\nClients:\n" +
        JSON.stringify(
          clients.map((c) => ({
            name: c.name,
            type: c.type,
            status: c.status,
            source: c.source,
            interests: c.interests,
            tags: c.tags,
          }))
        ) +
        "\n\nRevenue:\n" +
        JSON.stringify(
          revenueRecords.map((r) => ({
            source: r.source,
            category: r.category,
            amount: r.amount,
            currency: r.currency,
            recurring: r.recurring,
            status: r.status,
          }))
        ) +
        "\n\nMemories:\n" +
        JSON.stringify(
          memories.map((m) => ({
            type: m.type,
            title: m.title,
            content: m.content,
            tags: m.tags,
          }))
        ) +
        "\n\nAgents:\n" +
        JSON.stringify(
          agents.map((a) => ({
            name: a.name,
            department: a.department?.name,
            role: a.role,
            tags: a.tags,
            status: a.status,
          }))
        ) +
        "\n\nWorkflows:\n" +
        JSON.stringify(
          workflows.map((w) => ({
            name: w.name,
            trigger: w.trigger,
            action: w.action,
            status: w.status,
          }))
        ) +
        "\n\nKnowledge Graph Nodes:\n" +
        JSON.stringify(
          graphNodes.map((n) => ({
            type: n.type,
            label: n.label,
            summary: n.summary,
          }))
        ) +
        "\n\nKnowledge Graph Edges:\n" +
        JSON.stringify(
          graphEdges.map((e) => ({
            relation: e.relation,
            weight: e.weight,
          }))
        ),
    })

    const simulation = JSON.parse(response.output_text)

    await prisma.aiActivityEvent.create({
      data: {
        type: "simulation",
        title: "Strategic simulation generated",
        message: simulation.scenarioSummary || scenario,
        status: "success",
        metadata: simulation,
      },
    })

    return NextResponse.json({
      ok: true,
      simulation,
    })
  } catch (error) {
    console.error("Simulation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Simulation failed",
      },
      { status: 500 }
    )
  }
}