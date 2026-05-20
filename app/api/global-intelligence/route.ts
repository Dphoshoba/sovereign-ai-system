import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const starterSources = [
  {
    name: "Creator Economy Signals",
    sourceType: "manual-intelligence",
    category: "creator-economy",
    url: null,
    scanCadence: "weekly",
    metadata: {
      focus: "creator monetization, automation adoption, audience growth systems",
    },
  },
  {
    name: "AI Automation Market",
    sourceType: "manual-intelligence",
    category: "ai-automation",
    url: null,
    scanCadence: "weekly",
    metadata: {
      focus: "AI agents, workflow automation, business operations automation",
    },
  },
  {
    name: "SaaS Competitor Watch",
    sourceType: "manual-intelligence",
    category: "competitor-intelligence",
    url: null,
    scanCadence: "weekly",
    metadata: {
      focus: "pricing, positioning, feature gaps, marketing strategy",
    },
  },
]

export async function GET() {
  try {
    let sources = await prisma.externalSignalSource.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (sources.length === 0) {
      await prisma.externalSignalSource.createMany({
        data: starterSources,
      })

      sources = await prisma.externalSignalSource.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const [signals, scans] = await Promise.all([
      prisma.externalIntelligenceSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.externalWorldScan.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      sources,
      signals,
      scans,
    })
  } catch (error) {
    console.error("Global intelligence fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch global intelligence mesh" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const scanType = body.scanType || "creator-ai-market"

    const [
      sources,
      internalEvents,
      forecasts,
      strategicPlans,
      evolutionInsights,
      memories,
    ] = await Promise.all([
      prisma.externalSignalSource.findMany({ where: { enabled: true } }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.strategicPlan.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.evolutionInsight.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Global Intelligence Mesh for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " You analyze external strategic environments for creator economy, AI automation, SaaS positioning, competitor movement and market opportunity. " +
        "Use only the supplied context and general strategic reasoning. Mark uncertainty clearly. Return valid JSON only.",
      input:
        `Run an external world awareness scan for: ${scanType}.\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "findings":{
            "marketOpportunities":["..."],
            "externalRisks":["..."],
            "competitorSignals":["..."],
            "creatorEconomySignals":["..."],
            "strategicImplications":["..."]
          },
          "signals":[
            {
              "sourceName":"...",
              "signalType":"market-opportunity|external-risk|competitor-signal|trend-signal|strategic-shift",
              "category":"creator-economy|ai-automation|saas|competitor|market",
              "title":"...",
              "summary":"...",
              "relevanceScore":85,
              "severity":"low|medium|high|critical",
              "opportunity":true,
              "risk":false,
              "payload":{}
            }
          ]
        }` +
        "\n\nExternal Sources:\n" +
        JSON.stringify(sources) +
        "\n\nInternal Events:\n" +
        JSON.stringify(internalEvents) +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nStrategic Plans:\n" +
        JSON.stringify(strategicPlans) +
        "\n\nEvolution Insights:\n" +
        JSON.stringify(evolutionInsights) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const scan = await prisma.externalWorldScan.create({
      data: {
        title: parsed.title || "External World Awareness Scan",
        scanType,
        status: "completed",
        summary: parsed.summary || null,
        findings: parsed.findings || {},
      },
    })

    const savedSignals = []

    for (const item of parsed.signals || []) {
      const signal = await prisma.externalIntelligenceSignal.create({
        data: {
          sourceName: item.sourceName || "Global Intelligence Mesh",
          signalType: item.signalType || "trend-signal",
          category: item.category || "market",
          title: item.title,
          summary: item.summary || null,
          relevanceScore:
            typeof item.relevanceScore === "number" ? item.relevanceScore : 50,
          severity: item.severity || "medium",
          opportunity: Boolean(item.opportunity),
          risk: Boolean(item.risk),
          payload: item.payload || {},
          status: "new",
        },
      })

      savedSignals.push(signal)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "external-world-scan-completed",
        source: "global-intelligence-mesh",
        title: scan.title,
        message: scan.summary || null,
        severity: savedSignals.some((s) => s.severity === "critical")
          ? "critical"
          : "medium",
        entityType: "ExternalWorldScan",
        entityId: scan.id,
        payload: {
          scanId: scan.id,
          signalCount: savedSignals.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      scan,
      signals: savedSignals,
    })
  } catch (error) {
    console.error("External world scan failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "External world scan failed",
      },
      { status: 500 }
    )
  }
}