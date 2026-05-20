import { NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const starterPolicies = [
  {
    title: "High-risk execution approval required",
    description:
      "High-risk actions must require explicit approval before execution.",
    policyType: "execution-control",
    severity: "high",
    enforcement: "strict",
    conditions: {
      riskLevel: "high",
    },
    actions: {
      requireApproval: true,
    },
  },
  {
    title: "Protect runtime continuity",
    description:
      "Critical runtime systems should never be disabled automatically.",
    policyType: "runtime-protection",
    severity: "critical",
    enforcement: "strict",
    conditions: {
      targetSystem: "runtime",
    },
    actions: {
      preventDisable: true,
    },
  },
]

export async function GET() {
  try {
    let policies = await prisma.governancePolicy.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (policies.length === 0) {
      await prisma.governancePolicy.createMany({
        data: starterPolicies,
      })

      policies = await prisma.governancePolicy.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    const [arbitrations, approvals, risks] = await Promise.all([
      prisma.governanceArbitration.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.governanceApproval.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({
      ok: true,
      policies,
      arbitrations,
      approvals,
      risks,
    })
  } catch (error) {
    console.error("Governance matrix fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch governance matrix" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [
      initiatives,
      workflows,
      missions,
      toolActions,
      emails,
      retries,
      runtimeHeartbeats,
      orchestrationDecisions,
      evolutionPolicies,
      strategicPlans,
      strategicDecisions,
      events,
    ] = await Promise.all([
      prisma.strategicInitiative.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.workflowExecution.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.autonomousMissionTask.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.toolExecutionAction.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.emailExecution.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.runtimeRetryQueue.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.runtimeHeartbeat.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.orchestrationDecision.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.evolutionPolicyRecommendation.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.strategicPlan.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.strategicDecisionLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ])

    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Executive Governance Matrix and Autonomous Policy Arbitration System for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Protect organizational stability, detect dangerous behavior, arbitrate competing priorities and recommend governance actions. Return valid JSON only.",
      input:
        "Analyze the autonomous organization and produce governance findings.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "arbitrations":[
            {
              "title":"...",
              "arbitrationType":"resource-conflict|priority-conflict|risk-conflict|governance-review",
              "targetSystem":"...",
              "severity":"low|medium|high|critical",
              "rationale":"...",
              "riskScore":70,
              "competingItems":[]
            }
          ],
          "approvals":[
            {
              "title":"...",
              "targetType":"workflow|initiative|email|tool-action|policy|mission",
              "targetId":"...",
              "priority":"low|medium|high",
              "rationale":"..."
            }
          ],
          "riskSignals":[
            {
              "title":"...",
              "signalType":"runtime-risk|execution-risk|governance-risk|resource-risk|email-risk",
              "severity":"low|medium|high|critical",
              "affectedArea":"...",
              "description":"...",
              "recommendation":"..."
            }
          ]
        }` +
        "\n\nInitiatives:\n" + JSON.stringify(initiatives) +
        "\n\nWorkflows:\n" + JSON.stringify(workflows) +
        "\n\nMissions:\n" + JSON.stringify(missions) +
        "\n\nTool Actions:\n" + JSON.stringify(toolActions) +
        "\n\nEmails:\n" + JSON.stringify(emails) +
        "\n\nRetries:\n" + JSON.stringify(retries) +
        "\n\nRuntime Heartbeats:\n" + JSON.stringify(runtimeHeartbeats) +
        "\n\nOrchestration Decisions:\n" + JSON.stringify(orchestrationDecisions) +
        "\n\nEvolution Policies:\n" + JSON.stringify(evolutionPolicies) +
        "\n\nStrategic Plans:\n" + JSON.stringify(strategicPlans) +
        "\n\nStrategic Decisions:\n" + JSON.stringify(strategicDecisions) +
        "\n\nOperational Events:\n" + JSON.stringify(events),
    })

    const parsed = JSON.parse(response.output_text)

    const savedArbitrations = []

    for (const item of parsed.arbitrations || []) {
      const arbitration = await prisma.governanceArbitration.create({
        data: {
          title: item.title,
          arbitrationType: item.arbitrationType,
          targetSystem: item.targetSystem || null,
          severity: item.severity || "medium",
          rationale: item.rationale || null,
          competingItems: item.competingItems || [],
          riskScore:
            typeof item.riskScore === "number" ? item.riskScore : 50,
          status: "pending",
        },
      })

      savedArbitrations.push(arbitration)
    }

    const savedApprovals = []

    for (const item of parsed.approvals || []) {
      const approval = await prisma.governanceApproval.create({
        data: {
          title: item.title,
          targetType: item.targetType,
          targetId: item.targetId || null,
          priority: item.priority || "medium",
          rationale: item.rationale || null,
          status: "pending",
        },
      })

      savedApprovals.push(approval)
    }

    const savedRisks = []

    for (const item of parsed.riskSignals || []) {
      const risk = await prisma.governanceRiskSignal.create({
        data: {
          title: item.title,
          signalType: item.signalType,
          severity: item.severity || "medium",
          affectedArea: item.affectedArea || null,
          description: item.description || null,
          recommendation: item.recommendation || null,
          status: "open",
        },
      })

      savedRisks.push(risk)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "governance-analysis-generated",
        source: "governance-matrix",
        title: "Governance matrix analysis completed",
        message: `Generated ${savedArbitrations.length} arbitrations, ${savedApprovals.length} approvals and ${savedRisks.length} risk signals.`,
        severity: savedRisks.some((r) => r.severity === "critical")
          ? "critical"
          : "medium",
        payload: {
          arbitrationCount: savedArbitrations.length,
          approvalCount: savedApprovals.length,
          riskCount: savedRisks.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      arbitrations: savedArbitrations,
      approvals: savedApprovals,
      risks: savedRisks,
    })
  } catch (error) {
    console.error("Governance analysis failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Governance analysis failed",
      },
      { status: 500 }
    )
  }
}