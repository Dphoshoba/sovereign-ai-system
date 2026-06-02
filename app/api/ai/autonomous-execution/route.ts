import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import { getMemoryContext } from "@/lib/ai/memory-context"

export async function GET() {
  try {
    const actions = await prisma.aiAutonomousAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      actions,
    })
  } catch (error) {
    console.error("Autonomous actions fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch autonomous actions" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      articles,
      clients,
      revenue,
      activity,
      jobs,
      memories,
      workflows,
      agents,
    ] = await Promise.all([
      prisma.article.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.clientProfile.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.revenueRecord.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.aiActivityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.aiJob.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.aiMemory.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      prisma.aiWorkflow.findMany({ where: { status: "active" }, take: 50 }),
      prisma.aiAgent.findMany({
        where: { status: "active" },
        include: { department: true },
        take: 50,
      }),
    ])

    const memoryContext = await getMemoryContext({
      types: ["strategy", "audience", "publishing", "product", "ministry", "general"],
      limit: 12,
    })

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Execution Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Detect operational opportunities and propose safe next actions. " +
        "Do not recommend destructive actions. High-risk actions must require approval. " +
        "Return only valid JSON. No markdown.",
      input:
        "Analyze the current system state and propose autonomous actions.\n\n" +
        "Return JSON only in this exact format:\n" +
        `[
          {
            "title":"...",
            "description":"...",
            "source":"executive|growth|crm|publishing|revenue|scheduler|system",
            "priority":"low|medium|high",
            "actionType":"create_job|save_memory|run_kernel|run_mission_chain|run_simulation|log_activity|create_follow_up",
            "requiresApproval":true,
            "payload":{}
          }
        ]` +
        "\n\nMemory Context:\n" +
        memoryContext +
        "\n\nArticles:\n" +
        JSON.stringify(
          articles.map((a) => ({
            title: a.title,
            status: a.status,
            category: a.category,
            seoKeywords: a.seoKeywords,
            createdAt: a.createdAt,
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
            createdAt: c.createdAt,
          }))
        ) +
        "\n\nRevenue:\n" +
        JSON.stringify(
          revenue.map((r) => ({
            source: r.source,
            category: r.category,
            amount: r.amount,
            recurring: r.recurring,
            status: r.status,
            createdAt: r.createdAt,
          }))
        ) +
        "\n\nActivity:\n" +
        JSON.stringify(
          activity.map((e) => ({
            type: e.type,
            title: e.title,
            status: e.status,
            createdAt: e.createdAt,
          }))
        ) +
        "\n\nJobs:\n" +
        JSON.stringify(
          jobs.map((j) => ({
            type: j.type,
            status: j.status,
            attempts: j.attempts,
            error: j.error,
          }))
        ) +
        "\n\nWorkflows:\n" +
        JSON.stringify(
          workflows.map((w) => ({
            id: w.id,
            name: w.name,
            trigger: w.trigger,
            action: w.action,
          }))
        ) +
        "\n\nAgents:\n" +
        JSON.stringify(
          agents.map((a) => ({
            id: a.id,
            name: a.name,
            department: a.department?.name,
            role: a.role,
          }))
        ),
    })

    const proposedActions = JSON.parse(response.output_text)

    const savedActions = []

    for (const item of proposedActions) {
      const action = await prisma.aiAutonomousAction.create({
        data: {
          title: item.title,
          description: item.description || null,
          source: item.source || "system",
          status: "review-required",
          priority: item.priority || "medium",
          actionType: item.actionType,
          payload: {
            ...(item.payload || {}),
            requiresApproval: Boolean(item.requiresApproval),
          },
        },
      })

      savedActions.push(action)
    }

    await prisma.aiActivityEvent.create({
      data: {
        type: "autonomous-execution",
        title: "Autonomous action scan completed",
        message: `Generated ${savedActions.length} proposed actions.`,
        status: "success",
        metadata: {
          actionCount: savedActions.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      actions: savedActions,
    })
  } catch (error) {
    console.error("Autonomous execution scan failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Autonomous execution scan failed",
      },
      { status: 500 }
    )
  }
}