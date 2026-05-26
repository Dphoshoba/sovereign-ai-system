import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const starterNodes = [
  {
    name: "Echoes & Visions Core",
    nodeType: "primary-institution",
    domain: "creator-automation",
    trustLevel: 100,
    capabilities: ["strategy", "automation", "email", "governance", "economic-intelligence"],
  },
  {
    name: "Creator Growth Node",
    nodeType: "specialist-node",
    domain: "creator-economy",
    trustLevel: 75,
    capabilities: ["audience-growth", "content-systems", "lead-generation"],
  },
  {
    name: "Revenue Intelligence Node",
    nodeType: "specialist-node",
    domain: "economic-optimization",
    trustLevel: 80,
    capabilities: ["pricing", "proposal-recovery", "pipeline-optimization"],
  },
]

export async function GET() {
  try {
    let nodes = await prisma.federatedNode.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (nodes.length === 0) {
      await prisma.federatedNode.createMany({
        data: starterNodes,
      })

      nodes = await prisma.federatedNode.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const [signals, sessions, agreements, actions] = await Promise.all([
      prisma.federationSignal.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.federationCouncilSession.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.federationAgreement.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.federationAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
    ])

    return NextResponse.json({
      ok: true,
      nodes,
      signals,
      sessions,
      agreements,
      actions,
    })
  } catch (error) {
    console.error("Federated intelligence fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch federated intelligence" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      nodes,
      strategicPlans,
      economicRuns,
      temporalRuns,
      cognitiveInsights,
      governanceRisks,
      externalSignals,
      executiveCampaigns,
      opportunities,
    ] = await Promise.all([
      prisma.federatedNode.findMany({ where: { status: "active" } }),
      prisma.strategicPlan.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.economicIntelligenceRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.temporalSimulationRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.cognitiveInsight.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.governanceRiskSignal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.externalIntelligenceSignal.findMany({ orderBy: { relevanceScore: "desc" }, take: 100 }),
      prisma.executiveOperationCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.revenueOpportunity.findMany({ orderBy: { estimatedValue: "desc" }, take: 80 }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Federated Intelligence Network for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Coordinate multiple institutional intelligence nodes safely. Generate shared signals, council decisions, agreements and federation actions. Return valid JSON only.",
      input:
        "Run a federation council cycle.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "purpose":"...",
          "findings":{
            "sharedPriorities":["..."],
            "coordinationRisks":["..."],
            "collaborationOpportunities":["..."],
            "nodeSpecialization":["..."]
          },
          "decisions":[
            {
              "title":"...",
              "decision":"...",
              "rationale":"...",
              "priority":"low|medium|high"
            }
          ],
          "signals":[
            {
              "sourceNode":"...",
              "signalType":"shared-priority|risk-warning|opportunity|coordination-need|resource-request",
              "title":"...",
              "summary":"...",
              "priority":"low|medium|high",
              "payload":{}
            }
          ],
          "agreements":[
            {
              "title":"...",
              "agreementType":"collaboration|resource-sharing|governance|execution-boundary|intelligence-sharing",
              "parties":["..."],
              "terms":{},
              "riskLevel":"low|medium|high"
            }
          ],
          "actions":[
            {
              "title":"...",
              "actionType":"create-strategic-initiative|create-economic-campaign|create-governance-review|create-operational-event|store-memory",
              "targetNode":"...",
              "priority":"low|medium|high",
              "rationale":"...",
              "payload":{}
            }
          ]
        }` +
        "\n\nFederated Nodes:\n" + JSON.stringify(nodes) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nEconomic Runs:\n" + JSON.stringify(economicRuns) +
        "\n\nTemporal Runs:\n" + JSON.stringify(temporalRuns) +
        "\n\nCognitive Insights:\n" + JSON.stringify(cognitiveInsights) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nExternal Signals:\n" + JSON.stringify(externalSignals) +
        "\n\nExecutive Campaigns:\n" + JSON.stringify(executiveCampaigns) +
        "\n\nRevenue Opportunities:\n" + JSON.stringify(opportunities),
    })

    const parsed = JSON.parse(response.output_text)

    const session = await prisma.federationCouncilSession.create({
      data: {
        title: parsed.title || "Federation Council Session",
        purpose: parsed.purpose || null,
        participants: nodes.map((node) => node.name),
        findings: parsed.findings || {},
        decisions: parsed.decisions || [],
        status: "completed",
      },
    })

    const savedSignals = []

    for (const item of parsed.signals || []) {
      const signal = await prisma.federationSignal.create({
        data: {
          sourceNode: item.sourceNode || "Federation Council",
          signalType: item.signalType || "shared-priority",
          title: item.title,
          summary: item.summary || null,
          priority: item.priority || "medium",
          payload: item.payload || {},
          status: "new",
        },
      })

      savedSignals.push(signal)
    }

    const savedAgreements = []

    for (const item of parsed.agreements || []) {
      const agreement = await prisma.federationAgreement.create({
        data: {
          title: item.title,
          agreementType: item.agreementType || "collaboration",
          parties: item.parties || [],
          terms: item.terms || {},
          riskLevel: item.riskLevel || "medium",
          status: "proposed",
        },
      })

      savedAgreements.push(agreement)
    }

    const savedActions = []

    for (const item of parsed.actions || []) {
      const action = await prisma.federationAction.create({
        data: {
          title: item.title,
          actionType: item.actionType || "create-operational-event",
          targetNode: item.targetNode || null,
          priority: item.priority || "medium",
          rationale: item.rationale || null,
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedActions.push(action)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "federation-council-cycle",
        source: "federated-intelligence",
        title: session.title,
        message: session.purpose || null,
        severity: savedActions.some((a) => a.priority === "high") ? "high" : "medium",
        entityType: "FederationCouncilSession",
        entityId: session.id,
        payload: {
          sessionId: session.id,
          signalCount: savedSignals.length,
          agreementCount: savedAgreements.length,
          actionCount: savedActions.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      session,
      signals: savedSignals,
      agreements: savedAgreements,
      actions: savedActions,
    })
  } catch (error) {
    console.error("Federation council cycle failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Federation council cycle failed",
      },
      { status: 500 }
    )
  }
}