import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mission = body.mission as string

    if (!mission) {
      return NextResponse.json(
        { ok: false, error: "Mission is required" },
        { status: 400 }
      )
    }

    const [
      agents,
      workflows,
      permissions,
      memories,
      clients,
      articles,
      revenue,
      scheduledOperations,
    ] = await Promise.all([
      prisma.aiAgent.findMany({
        where: { status: "active" },
        include: { department: true },
        take: 100,
      }),
      prisma.aiWorkflow.findMany({
        where: { status: "active" },
        take: 100,
      }),
      prisma.aiPermissionRule.findMany({
        take: 100,
      }),
      prisma.aiMemory.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.clientProfile.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.article.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.revenueRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.aiScheduledOperation.findMany({
        orderBy: { nextRunAt: "asc" },
        take: 30,
      }),
    ])

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
      limit: 12,
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "kernel",
        title: "Kernel mission received",
        message: mission,
        status: "running",
      },
    })

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Unified AI Orchestration Kernel for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Route missions through the correct systems, agents, workflows and tools. " +
        "You are not allowed to execute destructive actions. " +
        "You must respect governance and recommend approval when needed. " +
        "Return only valid JSON. No markdown.",
      input:
        "Analyze this mission and create an orchestration plan.\n\nMission:\n" +
        mission +
        "\n\nRelevant Memory Context:\n" +
        memoryContext +
        "\n\nAvailable Agents:\n" +
        JSON.stringify(
          agents.map((a) => ({
            id: a.id,
            name: a.name,
            department: a.department?.name,
            role: a.role,
            tools: a.tools,
            tags: a.tags,
          }))
        ) +
        "\n\nActive Workflows:\n" +
        JSON.stringify(
          workflows.map((w) => ({
            id: w.id,
            name: w.name,
            trigger: w.trigger,
            action: w.action,
          }))
        ) +
        "\n\nPermission Rules:\n" +
        JSON.stringify(
          permissions.map((p) => ({
            agentId: p.agentId,
            department: p.department,
            action: p.action,
            allowed: p.allowed,
            requiresApproval: p.requiresApproval,
          }))
        ) +
        "\n\nClients:\n" +
        JSON.stringify(
          clients.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            status: c.status,
            interests: c.interests,
            tags: c.tags,
          }))
        ) +
        "\n\nArticles:\n" +
        JSON.stringify(
          articles.map((a) => ({
            id: a.id,
            title: a.title,
            category: a.category,
            status: a.status,
            seoKeywords: a.seoKeywords,
          }))
        ) +
        "\n\nRevenue:\n" +
        JSON.stringify(
          revenue.map((r) => ({
            source: r.source,
            category: r.category,
            amount: r.amount,
            recurring: r.recurring,
          }))
        ) +
        "\n\nScheduled Operations:\n" +
        JSON.stringify(
          scheduledOperations.map((s) => ({
            name: s.name,
            type: s.type,
            frequency: s.frequency,
            status: s.status,
            nextRunAt: s.nextRunAt,
          }))
        ) +
        "\n\nReturn JSON only in this exact format:\n" +
        `{
          "missionSummary":"...",
          "detectedIntent":"publishing|growth|crm|revenue|strategy|simulation|workflow|governance|general",
          "recommendedPath":"...",
          "systemsToUse":["..."],
          "agentsToUse":[{"agentId":"...","agentName":"...","reason":"..."}],
          "workflowSuggestions":[{"workflowId":"...","workflowName":"...","reason":"..."}],
          "toolActions":[{"action":"save_memory|create_job|log_activity|create_crm_client","requiresApproval":true,"reason":"...","payload":{}}],
          "governanceNotes":["..."],
          "executionSteps":["..."],
          "risks":["..."],
          "nextBestAction":"..."
        }`,
    })

    const plan = JSON.parse(response.output_text)

    await prisma.aiActivityEvent.create({
      data: {
        type: "kernel",
        title: "Kernel orchestration plan generated",
        message: plan.missionSummary || mission,
        status: "success",
        metadata: plan,
      },
    })

    return NextResponse.json({
      ok: true,
      plan,
    })
  } catch (error) {
    console.error("Kernel failed:", error)

    await prisma.aiActivityEvent.create({
      data: {
        type: "kernel",
        title: "Kernel orchestration failed",
        message: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
    })

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Kernel failed",
      },
      { status: 500 }
    )
  }
}