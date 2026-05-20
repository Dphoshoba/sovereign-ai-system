import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [forecasts, simulations] = await Promise.all([
      prisma.predictiveForecast.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.strategicSimulation.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      forecasts,
      simulations,
    })
  } catch (error) {
    console.error("Predictive intelligence fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch predictive intelligence" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      leads,
      proposals,
      invoices,
      audits,
      events,
      missions,
      memories,
      delegations,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.agentDelegation.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Predictive Intelligence Cortex for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Forecast future business trajectories, operational bottlenecks, creator behavior and revenue risks. Return valid JSON only.",
      input:
        "Generate strategic forecasts and enterprise predictions.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "forecasts":[
            {
              "title":"...",
              "forecastType":"revenue|creator-growth|operations|automation|pipeline",
              "timeframe":"30-days|90-days|6-months|12-months",
              "confidence":0.85,
              "summary":"...",
              "prediction":{
                "expectedOutcome":"...",
                "riskFactors":["..."],
                "opportunities":["..."]
              },
              "recommendations":["..."]
            }
          ]
        }` +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nAudits:\n" +
        JSON.stringify(audits) +
        "\n\nOperational Events:\n" +
        JSON.stringify(events) +
        "\n\nMission Tasks:\n" +
        JSON.stringify(missions) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories) +
        "\n\nDelegations:\n" +
        JSON.stringify(delegations),
    })

    const parsed = JSON.parse(response.output_text)

    const createdForecasts = []

    for (const item of parsed.forecasts || []) {
      const forecast = await prisma.predictiveForecast.create({
        data: {
          title: item.title,
          forecastType: item.forecastType,
          timeframe: item.timeframe,
          confidence: item.confidence || 0.7,
          summary: item.summary || null,
          prediction: item.prediction || {},
          recommendations: item.recommendations || [],
        },
      })

      createdForecasts.push(forecast)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "predictive-forecast-generated",
        source: "predictive-intelligence",
        title: "Strategic forecasting cycle completed",
        message: `Generated ${createdForecasts.length} strategic forecasts.`,
        severity: "medium",
        payload: {
          forecastCount: createdForecasts.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      forecasts: createdForecasts,
    })
  } catch (error) {
    console.error("Forecast generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Forecast generation failed",
      },
      { status: 500 }
    )
  }
}