import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { DAVID_WRITING_DNA } from "@/lib/ai/writing-dna"

async function seedMesh() {
  const nodes = await prisma.federatedMeshNode.findMany()

  if (nodes.length === 0) {
    const org = await prisma.sovereignOrganization.findUnique({
      where: { slug: "echoes-visions" },
    })

    await prisma.federatedMeshNode.createMany({
      data: [
        {
          organizationId: org?.id || null,
          nodeName: "Echoes & Visions Core Node",
          nodeType: "sovereign-core",
          domain: "institutional-intelligence",
          trustScore: 100,
          capabilities: [
            "memory",
            "reasoning",
            "governance",
            "execution",
            "billing",
            "semantic-graph",
          ],
          policies: {
            approvalRequiredForHighRisk: true,
            tenantIsolation: true,
          },
        },
        {
          nodeName: "Creator Economy Node",
          nodeType: "domain-node",
          domain: "creator-economy",
          trustScore: 82,
          capabilities: ["creator-audits", "crm", "lead-nurture", "content-systems"],
          policies: {
            shareOnlyAggregatedInsights: true,
          },
        },
        {
          nodeName: "Ministry Intelligence Node",
          nodeType: "domain-node",
          domain: "ministry",
          trustScore: 85,
          capabilities: ["teaching-systems", "discipleship", "content-planning"],
          policies: {
            theologicalReviewRequired: true,
          },
        },
      ],
    })
  }

  const protocols = await prisma.federationAllianceProtocol.findMany()

  if (protocols.length === 0) {
    await prisma.federationAllianceProtocol.createMany({
      data: [
        {
          title: "Trusted Internal Intelligence Exchange",
          protocolType: "intelligence-sharing",
          scope: "internal-federation",
          trustRequired: 75,
          rules: {
            tenantIsolation: true,
            noPrivateDataWithoutApproval: true,
            auditAllTransfers: true,
          },
          allowedPacketTypes: [
            "strategic-signal",
            "risk-warning",
            "workflow-pattern",
            "market-insight",
          ],
        },
        {
          title: "High-Risk Coordination Requires Governance",
          protocolType: "governance",
          scope: "cross-node-execution",
          trustRequired: 90,
          rules: {
            highRiskRequiresApproval: true,
            externalActionRequiresReview: true,
          },
          allowedPacketTypes: ["governance-alert", "execution-request"],
        },
      ],
    })
  }

  const societies = await prisma.meshAgentSociety.findMany()

  if (societies.length === 0) {
    await prisma.meshAgentSociety.create({
      data: {
        societyName: "Executive Coordination Society",
        societyType: "executive-agents",
        purpose:
          "Coordinate reasoning, governance, execution, memory and revenue agents across the sovereign runtime.",
        agents: [
          "Strategic Director",
          "Governance Arbiter",
          "Action Coordinator",
          "Memory Curator",
          "Revenue Operator",
        ],
        coordinationRules: {
          governanceBeforeExecution: true,
          memoryAfterOutcome: true,
          escalateCriticalRisk: true,
        },
        performanceScore: 75,
      },
    })
  }
}

export async function GET() {
  try {
    await seedMesh()

    const [nodes, packets, sessions, protocols, societies, runs] = await Promise.all([
      prisma.federatedMeshNode.findMany({
        orderBy: { trustScore: "desc" },
        take: 100,
      }),
      prisma.federatedIntelligencePacket.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.federationCoordinationSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.federationAllianceProtocol.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.meshAgentSociety.findMany({
        orderBy: { performanceScore: "desc" },
        take: 100,
      }),
      prisma.federationMeshRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    return NextResponse.json({
      ok: true,
      nodes,
      packets,
      sessions,
      protocols,
      societies,
      runs,
    })
  } catch (error) {
    console.error("Federated mesh fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch federated mesh" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await seedMesh()

    const [
      nodes,
      packets,
      protocols,
      societies,
      reasoningRuns,
      actionRuns,
      evolutionRuns,
      semanticRecords,
      graphNodes,
      governanceRisks,
      operationalEvents,
    ] = await Promise.all([
      prisma.federatedMeshNode.findMany({ orderBy: { trustScore: "desc" }, take: 100 }),
      prisma.federatedIntelligencePacket.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
      prisma.federationAllianceProtocol.findMany({ where: { status: "active" }, take: 80 }),
      prisma.meshAgentSociety.findMany({ where: { status: "active" }, take: 80 }),
      prisma.reasoningSimulationRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.actionCoordinationRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.evolutionOptimizationRun.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
      prisma.semanticKnowledgeRecord.findMany({ orderBy: { importance: "desc" }, take: 160 }),
      prisma.knowledgeGraphNode.findMany({ orderBy: { importance: "desc" }, take: 160 }),
      prisma.governanceRiskSignal.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.operationalEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Federated Intelligence Mesh for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Coordinate multi-node intelligence, agent societies and governed cross-system collaboration. " +
        "Protect tenant boundaries. Do not suggest unsafe uncontrolled autonomy. Return valid JSON only.",
      input:
        "Run a federated mesh coordination cycle.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "meshHealth":82,
          "trustHealth":80,
          "coordinationScore":78,
          "riskScore":35,
          "findings":{
            "coordinationStrengths":["..."],
            "meshRisks":["..."],
            "trustGaps":["..."],
            "crossNodeOpportunities":["..."],
            "agentSocietyImprovements":["..."]
          },
          "packets":[
            {
              "sourceNodeName":"...",
              "targetNodeName":"...",
              "packetType":"strategic-signal|risk-warning|workflow-pattern|market-insight|governance-alert|execution-request",
              "title":"...",
              "summary":"...",
              "priority":"low|medium|high|critical",
              "classification":"internal|restricted|governance",
              "payload":{}
            }
          ],
          "session":{
            "title":"...",
            "sessionType":"coordination|risk-review|strategy-sync|agent-council",
            "coordinationGoal":"...",
            "participatingNodes":["..."],
            "decisions":["..."],
            "risks":["..."],
            "outcomes":["..."]
          },
          "societyUpdates":[
            {
              "societyName":"...",
              "performanceScore":78,
              "agents":["..."],
              "coordinationRules":{},
              "purpose":"..."
            }
          ]
        }` +
        "\n\nMesh Nodes:\n" + JSON.stringify(nodes) +
        "\n\nExisting Packets:\n" + JSON.stringify(packets) +
        "\n\nProtocols:\n" + JSON.stringify(protocols) +
        "\n\nAgent Societies:\n" + JSON.stringify(societies) +
        "\n\nReasoning Runs:\n" + JSON.stringify(reasoningRuns) +
        "\n\nAction Runs:\n" + JSON.stringify(actionRuns) +
        "\n\nEvolution Runs:\n" + JSON.stringify(evolutionRuns) +
        "\n\nSemantic Records:\n" + JSON.stringify(semanticRecords) +
        "\n\nGraph Nodes:\n" + JSON.stringify(graphNodes) +
        "\n\nGovernance Risks:\n" + JSON.stringify(governanceRisks) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.federationMeshRun.create({
      data: {
        title: parsed.title || "Federated Mesh Coordination Run",
        summary: parsed.summary || null,
        meshHealth: parsed.meshHealth || 75,
        trustHealth: parsed.trustHealth || 75,
        coordinationScore: parsed.coordinationScore || 70,
        riskScore: parsed.riskScore || 35,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const nodeByName = new Map(nodes.map((node) => [node.nodeName, node.id]))

    for (const item of parsed.packets || []) {
      await prisma.federatedIntelligencePacket.create({
        data: {
          sourceNodeId: item.sourceNodeName
            ? nodeByName.get(item.sourceNodeName) || null
            : null,
          targetNodeId: item.targetNodeName
            ? nodeByName.get(item.targetNodeName) || null
            : null,
          packetType: item.packetType || "strategic-signal",
          title: item.title,
          summary: item.summary || null,
          priority: item.priority || "medium",
          classification: item.classification || "internal",
          payload: item.payload || {},
          status:
            item.classification === "governance" ||
            ["high", "critical"].includes(item.priority || "medium")
              ? "approval-aware"
              : "queued",
        },
      })
    }

    if (parsed.session) {
      await prisma.federationCoordinationSession.create({
        data: {
          title: parsed.session.title || "Mesh Coordination Session",
          sessionType: parsed.session.sessionType || "coordination",
          status: "completed",
          participatingNodes: parsed.session.participatingNodes || [],
          coordinationGoal: parsed.session.coordinationGoal || null,
          decisions: parsed.session.decisions || [],
          risks: parsed.session.risks || [],
          outcomes: parsed.session.outcomes || [],
        },
      })
    }

    for (const item of parsed.societyUpdates || []) {
      const existing = await prisma.meshAgentSociety.findFirst({
        where: { societyName: item.societyName },
      })

      if (existing) {
        await prisma.meshAgentSociety.update({
          where: { id: existing.id },
          data: {
            performanceScore: item.performanceScore || existing.performanceScore,
            agents: item.agents || existing.agents,
            coordinationRules: item.coordinationRules || existing.coordinationRules,
            purpose: item.purpose || existing.purpose,
          },
        })
      }
    }

    await prisma.operationalEvent.create({
      data: {
        type: "federated-mesh-run",
        source: "federated-mesh",
        title: run.title,
        message: run.summary || null,
        severity:
          run.riskScore >= 75 ? "critical" : run.riskScore >= 55 ? "high" : "medium",
        entityType: "FederationMeshRun",
        entityId: run.id,
      },
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    console.error("Federated mesh run failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Federated mesh run failed",
      },
      { status: 500 }
    )
  }
}