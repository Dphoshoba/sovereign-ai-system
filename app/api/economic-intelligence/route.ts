import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const [runs, opportunities, campaigns, decisions] = await Promise.all([
      prisma.economicIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.revenueOpportunity.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.economicCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.economicDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      opportunities,
      campaigns,
      decisions,
    })
  } catch (error) {
    console.error("Economic intelligence fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch economic intelligence" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      leads,
      audits,
      proposals,
      invoices,
      strategicPlans,
      initiatives,
      externalSignals,
      forecasts,
      executiveCampaigns,
      cognitiveInsights,
      governanceRisks,
      emails,
      events,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.strategicPlan.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.strategicInitiative.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.externalIntelligenceSignal.findMany({
        orderBy: { relevanceScore: "desc" },
        take: 100,
      }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.executiveOperationCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.cognitiveInsight.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.governanceRiskSignal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Economic Intelligence Layer for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Analyze revenue, opportunity, pricing, pipeline, monetization and economic strategy. " +
        "Do not invent financial facts. Use supplied data and mark uncertainty clearly. Return valid JSON only.",
      input:
        "Generate economic intelligence, revenue opportunities, campaigns and economic decisions.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "revenueHealth":78,
          "opportunityScore":82,
          "riskPressure":38,
          "findings":{
            "revenueStrengths":["..."],
            "revenueWeaknesses":["..."],
            "monetizationOpportunities":["..."],
            "economicRisks":["..."],
            "pricingInsights":["..."]
          },
          "opportunities":[
            {
              "title":"...",
              "description":"...",
              "opportunityType":"lead-conversion|proposal-recovery|pricing|campaign|upsell|retention|market-expansion",
              "estimatedValue":0,
              "confidence":0.75,
              "priority":"low|medium|high",
              "riskLevel":"low|medium|high",
              "targetSystem":"crm|email|revenue|strategy|workflow|external-intelligence",
              "executionPath":["..."]
            }
          ],
          "campaigns":[
            {
              "title":"...",
              "description":"...",
              "campaignType":"creator-acquisition|proposal-recovery|email-nurture|premium-offer|market-campaign",
              "revenueGoal":0,
              "priority":"low|medium|high",
              "riskLevel":"low|medium|high",
              "targetAudience":"...",
              "strategy":{}
            }
          ],
          "decisions":[
            {
              "title":"...",
              "decisionType":"pricing|pipeline|resource-allocation|campaign-priority|risk-control",
              "rationale":"...",
              "expectedImpact":"...",
              "priority":"low|medium|high",
              "payload":{}
            }
          ]
        }` +
        "\n\nLeads:\n" + JSON.stringify(leads) +
        "\n\nAudits:\n" + JSON.stringify(audits) +
        "\n\nProposals:\n" + JSON.stringify(proposals) +
        "\n\nInvoices:\n" + JSON.stringify(invoices) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nStrategic Initiatives:\n" + JSON.stringify(initiatives) +
        "\n\nExternal Signals:\n" + JSON.stringify(externalSignals) +
        "\n\nForecasts:\n" + JSON.stringify(forecasts) +
        "\n\nExecutive Campaigns:\n" + JSON.stringify(executiveCampaigns) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nEmails:\n" + JSON.stringify(emails) +
        "\n\nOperational Events:\n" + JSON.stringify(events),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.economicIntelligenceRun.create({
      data: {
        title: parsed.title || "Economic Intelligence Run",
        summary: parsed.summary || null,
        revenueHealth: parsed.revenueHealth || 70,
        opportunityScore: parsed.opportunityScore || 70,
        riskPressure: parsed.riskPressure || 40,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const savedOpportunities = []

    for (const item of parsed.opportunities || []) {
      const opportunity = await prisma.revenueOpportunity.create({
        data: {
          title: item.title,
          description: item.description || null,
          opportunityType: item.opportunityType || "campaign",
          estimatedValue:
            typeof item.estimatedValue === "number" ? item.estimatedValue : 0,
          confidence:
            typeof item.confidence === "number" ? item.confidence : 0.7,
          priority: item.priority || "medium",
          riskLevel: item.riskLevel || "medium",
          targetSystem: item.targetSystem || null,
          executionPath: item.executionPath || [],
          status: "identified",
        },
      })

      savedOpportunities.push(opportunity)
    }

    const savedCampaigns = []

    for (const item of parsed.campaigns || []) {
      const campaign = await prisma.economicCampaign.create({
        data: {
          title: item.title,
          description: item.description || null,
          campaignType: item.campaignType || "creator-acquisition",
          revenueGoal:
            typeof item.revenueGoal === "number" ? item.revenueGoal : 0,
          priority: item.priority || "medium",
          riskLevel: item.riskLevel || "medium",
          targetAudience: item.targetAudience || null,
          strategy: item.strategy || {},
          status: "planned",
        },
      })

      savedCampaigns.push(campaign)
    }

    const savedDecisions = []

    for (const item of parsed.decisions || []) {
      const decision = await prisma.economicDecision.create({
        data: {
          title: item.title,
          decisionType: item.decisionType || "pipeline",
          rationale: item.rationale || null,
          expectedImpact: item.expectedImpact || null,
          priority: item.priority || "medium",
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedDecisions.push(decision)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "economic-intelligence-run",
        source: "economic-intelligence",
        title: run.title,
        message: run.summary || null,
        severity: run.riskPressure >= 75 ? "high" : "medium",
        entityType: "EconomicIntelligenceRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          opportunityCount: savedOpportunities.length,
          campaignCount: savedCampaigns.length,
          decisionCount: savedDecisions.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
      opportunities: savedOpportunities,
      campaigns: savedCampaigns,
      decisions: savedDecisions,
    })
  } catch (error) {
    console.error("Economic intelligence run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Economic intelligence run failed",
      },
      { status: 500 }
    )
  }
}