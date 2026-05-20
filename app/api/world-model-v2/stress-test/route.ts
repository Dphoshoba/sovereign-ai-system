import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"
import {
  STRESS_SCENARIO_TYPES,
  clampScore,
} from "@/lib/ai/world-model-v2"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const runId = body.runId as string | undefined
    const stressTypes: string[] =
      Array.isArray(body.stressTypes) && body.stressTypes.length > 0
        ? body.stressTypes
        : [...STRESS_SCENARIO_TYPES]

    const run = runId
      ? await prisma.worldModelV2Run.findUnique({ where: { id: runId } })
      : await prisma.worldModelV2Run.findFirst({
          orderBy: { createdAt: "desc" },
        })

    if (!run) {
      return NextResponse.json(
        {
          ok: false,
          error: "No world model V2 run found. Run a simulation first.",
        },
        { status: 404 }
      )
    }

    const [domainSignals, scenarios, shocks, recommendations] =
      await Promise.all([
        prisma.planetaryDomainSignal.findMany({
          where: { runId: run.id },
          take: 80,
        }),
        prisma.planetaryScenarioV2.findMany({
          where: { runId: run.id },
          take: 40,
        }),
        prisma.strategicShockModel.findMany({
          where: { runId: run.id },
          take: 40,
        }),
        prisma.planetaryRecommendationV2.findMany({
          where: { runId: run.id },
          take: 40,
        }),
      ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the planetary stress testing module for Sovereign World Model V2. " +
        DAVID_WRITING_DNA +
        " Re-evaluate resilience under the requested stress scenarios using supplied run context. " +
        "Do not invent facts. Return valid JSON only.",
      input:
        `Run planetary stress tests for run: ${run.title} (${run.id}).\n` +
        `Stress types to evaluate: ${stressTypes.join(", ")}.\n\n` +
        "Return JSON only:\n" +
        `{
          "summary":"...",
          "stressTests":[
            {
              "title":"...",
              "stressType":"optimistic|balanced|disruptive|recessionary|regulatory-pressure|ai-acceleration|ministry-opportunity|creator-economy-contraction",
              "severity":"low|medium|high|critical",
              "resilienceScore":65,
              "description":"...",
              "mitigation":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nRun Context:\n" +
        JSON.stringify(run) +
        "\n\nDomain Signals:\n" +
        JSON.stringify(domainSignals) +
        "\n\nScenarios:\n" +
        JSON.stringify(scenarios) +
        "\n\nShocks:\n" +
        JSON.stringify(shocks) +
        "\n\nRecommendations:\n" +
        JSON.stringify(recommendations),
    })

    const parsed = JSON.parse(response.output_text)
    const savedStressTests = []

    for (const item of parsed.stressTests || []) {
      if (!stressTypes.includes(item.stressType)) continue

      const test = await prisma.planetaryStressTest.create({
        data: {
          runId: run.id,
          title: item.title,
          stressType: item.stressType,
          severity: item.severity || "medium",
          resilienceScore: clampScore(item.resilienceScore, 70),
          description: item.description || null,
          mitigation: item.mitigation || null,
          payload: {
            ...(item.payload || {}),
            stressTestPass: true,
            summary: parsed.summary || null,
          },
        },
      })

      savedStressTests.push(test)
    }

    const avgResilience =
      savedStressTests.length > 0
        ? Math.round(
            savedStressTests.reduce((sum, t) => sum + t.resilienceScore, 0) /
              savedStressTests.length
          )
        : run.strategicReadiness

    await prisma.worldModelV2Run.update({
      where: { id: run.id },
      data: {
        strategicReadiness: avgResilience,
        findings: {
          ...(typeof run.findings === "object" && run.findings !== null
            ? (run.findings as object)
            : {}),
          lastStressTest: {
            at: new Date().toISOString(),
            summary: parsed.summary || null,
            stressTypes,
            avgResilience,
          },
        },
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "world-model-v2-stress-test-completed",
        source: "world-model-v2",
        title: `Stress test: ${run.title}`,
        message: parsed.summary || null,
        severity:
          avgResilience < 45 ? "critical" : avgResilience < 60 ? "high" : "medium",
        entityType: "WorldModelV2Run",
        entityId: run.id,
        payload: {
          runId: run.id,
          stressTestCount: savedStressTests.length,
          avgResilience,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      runId: run.id,
      summary: parsed.summary || null,
      stressTests: savedStressTests,
      avgResilience,
    })
  } catch (error) {
    console.error("World model V2 stress test failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Planetary stress test failed",
      },
      { status: 500 }
    )
  }
}
