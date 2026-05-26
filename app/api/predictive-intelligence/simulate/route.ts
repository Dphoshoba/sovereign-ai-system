import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.scenario) {
      return NextResponse.json(
        { ok: false, error: "scenario is required" },
        { status: 400 }
      )
    }

    const [
      leads,
      proposals,
      invoices,
      forecasts,
      events,
      missions,
      memories,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.predictiveForecast.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.autonomousMissionTask.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Strategic Simulation Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Simulate future operational scenarios, scaling conditions and strategic decisions. Return valid JSON only.",
      input:
        `Scenario:\n${body.scenario}\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "results":{
            "bestCase":"...",
            "expectedCase":"...",
            "worstCase":"..."
          },
          "risks":["..."],
          "opportunities":["..."],
          "recommendedActions":["..."],
          "riskLevel":"low|medium|high|critical",
          "recommendation":"..."
        }` +
        "\n\nForecasts:\n" +
        JSON.stringify(forecasts) +
        "\n\nLeads:\n" +
        JSON.stringify(leads) +
        "\n\nProposals:\n" +
        JSON.stringify(proposals) +
        "\n\nInvoices:\n" +
        JSON.stringify(invoices) +
        "\n\nEvents:\n" +
        JSON.stringify(events) +
        "\n\nMission Tasks:\n" +
        JSON.stringify(missions) +
        "\n\nStrategic Memories:\n" +
        JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const simulation = await prisma.strategicSimulation.create({
      data: {
        title: parsed.title || "Strategic Simulation",
        scenario: body.scenario,
        assumptions: body.assumptions || {},
        results: parsed.results || {},
        riskLevel: parsed.riskLevel || "medium",
        recommendation: parsed.recommendation || null,
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "strategic-simulation-completed",
        source: "predictive-intelligence",
        title: simulation.title,
        message: parsed.recommendation || null,
        severity:
          parsed.riskLevel === "critical"
            ? "critical"
            : parsed.riskLevel === "high"
            ? "high"
            : "medium",
        entityType: "StrategicSimulation",
        entityId: simulation.id,
        payload: parsed,
      },
    })

    return NextResponse.json({
      ok: true,
      simulation,
      results: parsed,
    })
  } catch (error) {
    console.error("Strategic simulation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Strategic simulation failed",
      },
      { status: 500 }
    )
  }
}