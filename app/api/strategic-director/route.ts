import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

export async function GET() {
  try {
    const [plans, initiatives, decisions] = await Promise.all([
      prisma.strategicPlan.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.strategicInitiative.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.strategicDecisionLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({
      ok: true,
      plans,
      initiatives,
      decisions,
    })
  } catch (error) {
    console.error("Strategic director fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch strategic director data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const timeHorizon = body.timeHorizon || "90-days"

    const [
      leads,
      audits,
      proposals,
      invoices,
      events,
      forecasts,
      simulations,
      optimizationRuns,
      optimizationActions,
      runtimeObjectives,
      runtimeHeartbeats,
      evolutionRuns,
      evolutionInsights,
      policies,
      workflows,
      missions,
      agents,
      delegations,
      emails,
      memories,
    ] = await Promise.all([
      prisma.creatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorAuditRequest.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorProposal.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.creatorInvoice.findMany({ orderBy: { createdAt: "desc" }, take: 150 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.predictiveForecast.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.strategicSimulation.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.optimizationRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.optimizationAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.runtimeObjective.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.runtimeHeartbeat.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.evolutionRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.evolutionInsight.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.evolutionPolicyRecommendation.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.workflowDefinition.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.executiveAgent.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.agentDelegation.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.creatorLearningMemory.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Strategic Intelligence Director for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Convert operating data into strategic direction, executive priorities, initiatives, resource allocation and measurable plans. " +
        "Do not invent performance facts. Mark uncertainty clearly. Return valid JSON only.",
      input:
        `Create an executive strategic plan for the next ${timeHorizon}.\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "strategicThesis":"...",
          "priorities":[
            {
              "title":"...",
              "priority":"low|medium|high",
              "reason":"...",
              "targetOutcome":"..."
            }
          ],
          "initiatives":[
            {
              "title":"...",
              "description":"...",
              "priority":"low|medium|high",
              "ownerSystem":"crm|revenue|agents|workflow|email|runtime|optimization|forecasting|governance|creator-acquisition",
              "targetOutcome":"...",
              "riskLevel":"low|medium|high",
              "executionPath":["..."]
            }
          ],
          "resourcePlan":{
            "focusAllocation":["..."],
            "systemsToProtect":["..."],
            "systemsToAccelerate":["..."]
          },
          "riskMap":{
            "strategicRisks":["..."],
            "operationalRisks":["..."],
            "revenueRisks":["..."]
          },
          "successMetrics":["..."],
          "executiveDecisions":[
            {
              "title":"...",
              "decision":"...",
              "rationale":"...",
              "impactArea":"growth|revenue|operations|governance|product|market"
            }
          ]
        }` +
        "\n\nLeads:\n" + JSON.stringify(leads) +
        "\n\nAudits:\n" + JSON.stringify(audits) +
        "\n\nProposals:\n" + JSON.stringify(proposals) +
        "\n\nInvoices:\n" + JSON.stringify(invoices) +
        "\n\nOperational Events:\n" + JSON.stringify(events) +
        "\n\nForecasts:\n" + JSON.stringify(forecasts) +
        "\n\nSimulations:\n" + JSON.stringify(simulations) +
        "\n\nOptimization Runs:\n" + JSON.stringify(optimizationRuns) +
        "\n\nOptimization Actions:\n" + JSON.stringify(optimizationActions) +
        "\n\nRuntime Objectives:\n" + JSON.stringify(runtimeObjectives) +
        "\n\nRuntime Heartbeats:\n" + JSON.stringify(runtimeHeartbeats) +
        "\n\nEvolution Runs:\n" + JSON.stringify(evolutionRuns) +
        "\n\nEvolution Insights:\n" + JSON.stringify(evolutionInsights) +
        "\n\nPolicy Recommendations:\n" + JSON.stringify(policies) +
        "\n\nWorkflows:\n" + JSON.stringify(workflows) +
        "\n\nMissions:\n" + JSON.stringify(missions) +
        "\n\nAgents:\n" + JSON.stringify(agents) +
        "\n\nDelegations:\n" + JSON.stringify(delegations) +
        "\n\nEmails:\n" + JSON.stringify(emails) +
        "\n\nStrategic Memories:\n" + JSON.stringify(memories),
    })

    const parsed = JSON.parse(response.output_text)

    const plan = await prisma.strategicPlan.create({
      data: {
        title: parsed.title || "Strategic Plan",
        timeHorizon,
        status: "review-required",
        strategicThesis: parsed.strategicThesis || null,
        priorities: parsed.priorities || [],
        initiatives: parsed.initiatives || [],
        resourcePlan: parsed.resourcePlan || {},
        riskMap: parsed.riskMap || {},
        successMetrics: parsed.successMetrics || [],
      },
    })

    const savedInitiatives = []

    for (const item of parsed.initiatives || []) {
      const initiative = await prisma.strategicInitiative.create({
        data: {
          planId: plan.id,
          title: item.title,
          description: item.description || null,
          priority: item.priority || "medium",
          ownerSystem: item.ownerSystem || null,
          targetOutcome: item.targetOutcome || null,
          executionPath: item.executionPath || [],
          riskLevel: item.riskLevel || "medium",
          status: "proposed",
        },
      })

      savedInitiatives.push(initiative)
    }

    const savedDecisions = []

    for (const item of parsed.executiveDecisions || []) {
      const decision = await prisma.strategicDecisionLog.create({
        data: {
          title: item.title,
          decision: item.decision,
          rationale: item.rationale || null,
          impactArea: item.impactArea || null,
          status: "recorded",
          metadata: {
            planId: plan.id,
          },
        },
      })

      savedDecisions.push(decision)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "strategic-plan-generated",
        source: "strategic-director",
        title: plan.title,
        message: parsed.strategicThesis || null,
        severity: "medium",
        entityType: "StrategicPlan",
        entityId: plan.id,
        payload: {
          planId: plan.id,
          initiativeCount: savedInitiatives.length,
          decisionCount: savedDecisions.length,
          timeHorizon,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      plan,
      initiatives: savedInitiatives,
      decisions: savedDecisions,
    })
  } catch (error) {
    console.error("Strategic plan generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Strategic plan generation failed",
      },
      { status: 500 }
    )
  }
}