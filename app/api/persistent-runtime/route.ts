import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const starterObjectives = [
  {
    title: "Maintain creator acquisition health",
    description:
      "Continuously monitor creator leads, hot signals, nurture readiness and conversion opportunities.",
    priority: "high",
    cadence: "daily",
  },
  {
    title: "Protect revenue pipeline",
    description:
      "Watch proposals, invoices, payment readiness and stalled revenue opportunities.",
    priority: "high",
    cadence: "daily",
  },
  {
    title: "Preserve operational stability",
    description:
      "Monitor failed actions, pending missions, high-severity events and workflow bottlenecks.",
    priority: "high",
    cadence: "daily",
  },
]

export async function GET() {
  try {
    let objectives = await prisma.runtimeObjective.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (objectives.length === 0) {
      await prisma.runtimeObjective.createMany({
        data: starterObjectives,
      })

      objectives = await prisma.runtimeObjective.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const [heartbeats, snapshots, retries] = await Promise.all([
      prisma.runtimeHeartbeat.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.runtimeMemorySnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.runtimeRetryQueue.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({
      ok: true,
      objectives,
      heartbeats,
      snapshots,
      retries,
    })
  } catch (error) {
    console.error("Persistent runtime fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch persistent runtime" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      objectives,
      events,
      workflows,
      missions,
      decisions,
      toolActions,
      emails,
      optimizations,
      forecasts,
      memories,
    ] = await Promise.all([
      prisma.runtimeObjective.findMany({ where: { status: "active" } }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.workflowExecution.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.orchestrationDecision.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.toolExecutionAction.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.optimizationRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const failedItems = [
      ...toolActions.filter((item) => item.status === "failed").map((item) => ({
        source: "tool-action",
        sourceId: item.id,
        title: item.title,
        error: item.error,
      })),
      ...emails.filter((item) => item.status === "failed").map((item) => ({
        source: "email",
        sourceId: item.id,
        title: item.subject,
        error: item.error,
      })),
      ...decisions.filter((item) => item.status === "failed").map((item) => ({
        source: "orchestration-decision",
        sourceId: item.id,
        title: item.title,
        error: item.error,
      })),
    ]

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Persistent Autonomous Runtime for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        "Maintain continuity, summarize operating state, identify failed or stalled items and preserve organizational memory. Return valid JSON only.",
      input:
        "Analyze the autonomous operating system and produce a runtime heartbeat + memory snapshot.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "status":"alive|warning|critical",
          "healthScore":85,
          "summary":"...",
          "metrics":{
            "activeObjectives":0,
            "openEvents":0,
            "pendingMissions":0,
            "failedItems":0,
            "queuedActions":0
          },
          "memorySnapshot":{
            "whatChanged":"...",
            "whatNeedsAttention":["..."],
            "continuityNotes":["..."],
            "nextRuntimeFocus":["..."]
          },
          "retryRecommendations":[
            {
              "source":"...",
              "sourceId":"...",
              "title":"...",
              "reason":"..."
            }
          ]
        }` +
        "\n\nObjectives:\n" +
        JSON.stringify(objectives) +
        "\n\nOperational Events:\n" +
        JSON.stringify(events) +
        "\n\nWorkflow Executions:\n" +
        JSON.stringify(workflows) +
        "\n\nMissions:\n" +
        JSON.stringify(missions) +
        "\n\nOrchestration Decisions:\n" +
        JSON.stringify(decisions) +
        "\n\nTool Actions:\n" +
        JSON.stringify(toolActions) +
        "\n\nEmails:\n" +
        JSON.stringify(emails) +
        "\n\nOptimization Runs:\n" +
        JSON.stringify(optimizations) +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories) +
        "\n\nFailed Items:\n" +
        JSON.stringify(failedItems),
    })

    const parsed = JSON.parse(response.output_text)

    const heartbeat = await prisma.runtimeHeartbeat.create({
      data: {
        status: parsed.status || "alive",
        summary: parsed.summary || null,
        healthScore:
          typeof parsed.healthScore === "number" ? parsed.healthScore : 80,
        metrics: parsed.metrics || {},
      },
    })

    const snapshot = await prisma.runtimeMemorySnapshot.create({
      data: {
        title: "Runtime Memory Snapshot",
        summary: parsed.memorySnapshot?.whatChanged || parsed.summary || null,
        snapshot: parsed.memorySnapshot || {},
      },
    })

    for (const item of parsed.retryRecommendations || []) {
      await prisma.runtimeRetryQueue.create({
        data: {
          source: item.source || "unknown",
          sourceId: item.sourceId || null,
          title: item.title || "Retry recommended",
          status: "queued",
          attempts: 0,
          maxAttempts: 3,
          error: item.reason || null,
          payload: item,
          nextRetryAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      })
    }

    await prisma.operationalEvent.create({
      data: {
        type: "runtime-heartbeat",
        source: "persistent-runtime",
        title: "Persistent runtime heartbeat generated",
        message: parsed.summary || null,
        severity:
          parsed.status === "critical"
            ? "critical"
            : parsed.status === "warning"
              ? "high"
              : "info",
        entityType: "RuntimeHeartbeat",
        entityId: heartbeat.id,
        payload: {
          heartbeatId: heartbeat.id,
          snapshotId: snapshot.id,
          healthScore: heartbeat.healthScore,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      heartbeat,
      snapshot,
    })
  } catch (error) {
    console.error("Persistent runtime heartbeat failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Persistent runtime heartbeat failed",
      },
      { status: 500 }
    )
  }
}