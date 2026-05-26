import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

async function getDefaultTenant() {
  const org = await prisma.sovereignOrganization.findUnique({
    where: { slug: "echoes-visions" },
  })

  const workspace = org
    ? await prisma.organizationWorkspace.findFirst({
        where: { organizationId: org.id },
        orderBy: { createdAt: "asc" },
      })
    : null

  return { org, workspace }
}

export async function GET() {
  try {
    const [runs, options, consequences, recommendations] = await Promise.all([
      prisma.reasoningSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.strategicDecisionOption.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.decisionConsequenceModel.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.reasoningRecommendation.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    return NextResponse.json({
      ok: true,
      runs,
      options,
      consequences,
      recommendations,
    })
  } catch (error) {
    console.error("Reasoning engine fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch reasoning engine" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const question =
      body.question ||
      "What is the highest-leverage strategic decision Echoes & Visions should make next?"

    const reasoningType = body.reasoningType || "strategic-decision"

    const { org, workspace } = await getDefaultTenant()

    const [
      memoryRecords,
      graphNodes,
      graphEdges,
      semanticQueries,
      sovereignSnapshots,
      billingRuns,
      governanceRisks,
      tenantSnapshots,
      realtimeRuns,
      operationalEvents,
    ] = await Promise.all([
      prisma.semanticKnowledgeRecord.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
        take: 160,
      }),
      prisma.knowledgeGraphNode.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: { importance: "desc" },
        take: 160,
      }),
      prisma.knowledgeGraphEdge.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: { strength: "desc" },
        take: 200,
      }),
      prisma.semanticMemoryQuery.findMany({
        where: {
          organizationId: org?.id || undefined,
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.sovereignRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.billingIntelligenceRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.governanceRiskSignal.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.tenantRuntimeSnapshot.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.realtimeFabricRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Reasoning Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Use supplied semantic memory, graph nodes, graph edges, governance signals and runtime data to reason through strategic decisions. " +
        "Do not invent facts. Clearly mark uncertainty. High-risk recommendations must require approval. Return valid JSON only.",
      input:
        "Run a strategic decision simulation.\n\n" +
        `Question: ${question}\n\n` +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "confidenceScore":0.76,
          "strategicScore":82,
          "riskScore":38,
          "opportunityScore":84,
          "reasoningTrace":[
            "Step 1: ...",
            "Step 2: ...",
            "Step 3: ..."
          ],
          "findings":{
            "knownFacts":["..."],
            "uncertainties":["..."],
            "strategicTensions":["..."],
            "decisionCriteria":["..."],
            "bestPath":["..."]
          },
          "options":[
            {
              "title":"...",
              "optionType":"strategy|governance|revenue|infrastructure|memory|operations",
              "description":"...",
              "upside":"...",
              "downside":"...",
              "riskLevel":"low|medium|high|critical",
              "confidence":0.7,
              "strategicValue":80,
              "costPressure":35,
              "timeHorizon":"immediate|near-term|quarter|long-term",
              "payload":{}
            }
          ],
          "consequences":[
            {
              "optionTitle":"...",
              "title":"...",
              "consequenceType":"positive|negative|risk|dependency|opportunity",
              "probability":0.65,
              "impactLevel":"low|medium|high|critical",
              "description":"...",
              "mitigation":"...",
              "payload":{}
            }
          ],
          "recommendations":[
            {
              "title":"...",
              "recommendationType":"strategy|governance|execution|billing|memory|infrastructure",
              "priority":"low|medium|high|critical",
              "rationale":"...",
              "expectedOutcome":"...",
              "requiredApproval":true,
              "payload":{}
            }
          ]
        }` +
        "\n\nSemantic Memory Records:\n" +
        JSON.stringify(memoryRecords) +
        "\n\nGraph Nodes:\n" +
        JSON.stringify(graphNodes) +
        "\n\nGraph Edges:\n" +
        JSON.stringify(graphEdges) +
        "\n\nSemantic Queries:\n" +
        JSON.stringify(semanticQueries) +
        "\n\nSovereign Snapshots:\n" +
        JSON.stringify(sovereignSnapshots) +
        "\n\nBilling Runs:\n" +
        JSON.stringify(billingRuns) +
        "\n\nGovernance Risks:\n" +
        JSON.stringify(governanceRisks) +
        "\n\nTenant Snapshots:\n" +
        JSON.stringify(tenantSnapshots) +
        "\n\nRealtime Runs:\n" +
        JSON.stringify(realtimeRuns) +
        "\n\nOperational Events:\n" +
        JSON.stringify(operationalEvents),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.reasoningSimulationRun.create({
      data: {
        organizationId: org?.id || null,
        workspaceId: workspace?.id || null,
        title: parsed.title || "Strategic Decision Simulation",
        reasoningType,
        question,
        summary: parsed.summary || null,
        confidenceScore: parsed.confidenceScore || 0.7,
        strategicScore: parsed.strategicScore || 75,
        riskScore: parsed.riskScore || 40,
        opportunityScore: parsed.opportunityScore || 75,
        reasoningTrace: parsed.reasoningTrace || [],
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const optionTitleToId = new Map<string, string>()

    for (const item of parsed.options || []) {
      const option = await prisma.strategicDecisionOption.create({
        data: {
          runId: run.id,
          title: item.title,
          optionType: item.optionType || "strategy",
          description: item.description || null,
          upside: item.upside || null,
          downside: item.downside || null,
          riskLevel: item.riskLevel || "medium",
          confidence: item.confidence || 0.7,
          strategicValue: item.strategicValue || 70,
          costPressure: item.costPressure || 40,
          timeHorizon: item.timeHorizon || "near-term",
          payload: item.payload || {},
        },
      })

      optionTitleToId.set(option.title, option.id)
    }

    for (const item of parsed.consequences || []) {
      await prisma.decisionConsequenceModel.create({
        data: {
          runId: run.id,
          optionId: item.optionTitle
            ? optionTitleToId.get(item.optionTitle) || null
            : null,
          title: item.title,
          consequenceType: item.consequenceType || "risk",
          probability: item.probability || 0.5,
          impactLevel: item.impactLevel || "medium",
          description: item.description || null,
          mitigation: item.mitigation || null,
          payload: item.payload || {},
        },
      })
    }

    const savedRecommendations = []

    for (const item of parsed.recommendations || []) {
      const recommendation = await prisma.reasoningRecommendation.create({
        data: {
          runId: run.id,
          title: item.title,
          recommendationType: item.recommendationType || "strategy",
          priority: item.priority || "medium",
          rationale: item.rationale || null,
          expectedOutcome: item.expectedOutcome || null,
          requiredApproval:
            typeof item.requiredApproval === "boolean"
              ? item.requiredApproval
              : true,
          payload: item.payload || {},
          status: "proposed",
        },
      })

      savedRecommendations.push(recommendation)
    }

    await prisma.operationalEvent.create({
      data: {
        type: "reasoning-simulation-completed",
        source: "reasoning-engine",
        title: run.title,
        message: run.summary || null,
        severity:
          run.riskScore >= 75 ? "critical" : run.riskScore >= 55 ? "high" : "medium",
        entityType: "ReasoningSimulationRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          recommendationCount: savedRecommendations.length,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    console.error("Reasoning simulation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Reasoning simulation failed",
      },
      { status: 500 }
    )
  }
}