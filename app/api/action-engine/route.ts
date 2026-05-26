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
    const [missions, steps, assignments, runs, outcomes] = await Promise.all([
      prisma.actionMission.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.actionExecutionStep.findMany({
        orderBy: [{ status: "asc" }, { sequence: "asc" }],
        take: 200,
      }),
      prisma.agentExecutionAssignment.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.actionCoordinationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.actionOutcomeRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
      }),
    ])

    return NextResponse.json({
      ok: true,
      missions,
      steps,
      assignments,
      runs,
      outcomes,
    })
  } catch (error) {
    console.error("Action engine fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch action engine" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const { org, workspace } = await getDefaultTenant()

    const [
      recommendations,
      reasoningRuns,
      governanceRequests,
      realtimeJobs,
      executiveAgents,
      semanticRecords,
      graphNodes,
      operationalEvents,
      sovereignActions,
    ] = await Promise.all([
      prisma.reasoningRecommendation.findMany({
        where: {
          status: {
            in: ["proposed", "approval-requested", "activated"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      prisma.reasoningSimulationRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.executionAuthorizationRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.distributedExecutionJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.executiveAgent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.semanticKnowledgeRecord.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: { importance: "desc" },
        take: 120,
      }),
      prisma.knowledgeGraphNode.findMany({
        where: {
          organizationId: org?.id || undefined,
          status: "active",
        },
        orderBy: { importance: "desc" },
        take: 120,
      }),
      prisma.operationalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.sovereignRuntimeAction.findMany({
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ])

    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are the Autonomous Action Engine for Echoes & Visions. " +
        DAVID_WRITING_DNA +
        " Convert governed recommendations and runtime signals into coordinated missions, agent assignments, execution steps and measurable outcomes. " +
        "Do not bypass governance. High-risk execution must remain pending or approval-aware. Return valid JSON only.",
      input:
        "Generate autonomous action coordination.\n\n" +
        "Return JSON only in this exact format:\n" +
        `{
          "title":"...",
          "summary":"...",
          "executionHealth":80,
          "agentHealth":78,
          "missionPressure":35,
          "findings":{
            "readyToExecute":["..."],
            "blockedByGovernance":["..."],
            "agentCoordinationNeeds":["..."],
            "missionRisks":["..."],
            "nextExecutionMoves":["..."]
          },
          "missions":[
            {
              "title":"...",
              "missionType":"crm-follow-up|strategy-execution|governance-review|revenue-operation|memory-enrichment|infrastructure-hardening",
              "priority":"low|medium|high|critical",
              "objective":"...",
              "successCriteria":["..."],
              "assignedAgents":["..."],
              "riskLevel":"low|medium|high|critical"
            }
          ],
          "steps":[
            {
              "missionTitle":"...",
              "title":"...",
              "stepType":"create-record|send-email-draft|create-governance-request|create-runtime-job|store-memory|create-operational-event|manual-review",
              "targetLayer":"crm|email|governance|runtime|memory|operations|billing",
              "assignedAgent":"...",
              "sequence":1,
              "priority":"low|medium|high|critical",
              "instruction":"...",
              "payload":{}
            }
          ],
          "assignments":[
            {
              "missionTitle":"...",
              "stepTitle":"...",
              "agentName":"...",
              "agentRole":"...",
              "instruction":"...",
              "confidence":0.75
            }
          ]
        }` +
        "\n\nReasoning Recommendations:\n" + JSON.stringify(recommendations) +
        "\n\nReasoning Runs:\n" + JSON.stringify(reasoningRuns) +
        "\n\nGovernance Requests:\n" + JSON.stringify(governanceRequests) +
        "\n\nRealtime Jobs:\n" + JSON.stringify(realtimeJobs) +
        "\n\nExecutive Agents:\n" + JSON.stringify(executiveAgents) +
        "\n\nSemantic Records:\n" + JSON.stringify(semanticRecords) +
        "\n\nGraph Nodes:\n" + JSON.stringify(graphNodes) +
        "\n\nOperational Events:\n" + JSON.stringify(operationalEvents) +
        "\n\nSovereign Runtime Actions:\n" + JSON.stringify(sovereignActions),
    })

    const parsed = JSON.parse(response.output_text)

    const run = await prisma.actionCoordinationRun.create({
      data: {
        organizationId: org?.id || null,
        workspaceId: workspace?.id || null,
        title: parsed.title || "Action Coordination Run",
        summary: parsed.summary || null,
        executionHealth: parsed.executionHealth || 75,
        agentHealth: parsed.agentHealth || 75,
        missionPressure: parsed.missionPressure || 35,
        findings: parsed.findings || {},
        status: "completed",
      },
    })

    const missionTitleToId = new Map<string, string>()

    for (const item of parsed.missions || []) {
      const mission = await prisma.actionMission.create({
        data: {
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
          title: item.title,
          missionType: item.missionType || "strategic-execution",
          priority: item.priority || "medium",
          objective: item.objective || null,
          successCriteria: item.successCriteria || [],
          assignedAgents: item.assignedAgents || [],
          riskLevel: item.riskLevel || "medium",
          status:
            ["high", "critical"].includes(item.riskLevel || "medium")
              ? "approval-aware"
              : "planned",
          progressScore: 0,
        },
      })

      missionTitleToId.set(mission.title, mission.id)
    }

    const stepTitleToId = new Map<string, string>()

    for (const item of parsed.steps || []) {
      const missionId = item.missionTitle
        ? missionTitleToId.get(item.missionTitle)
        : null

      const step = await prisma.actionExecutionStep.create({
        data: {
          missionId: missionId || null,
          title: item.title,
          stepType: item.stepType || "manual-review",
          targetLayer: item.targetLayer || "operations",
          assignedAgent: item.assignedAgent || null,
          sequence: item.sequence || 1,
          priority: item.priority || "medium",
          instruction: item.instruction || null,
          payload: item.payload || {},
          status:
            ["high", "critical"].includes(item.priority || "medium")
              ? "approval-required"
              : "queued",
        },
      })

      stepTitleToId.set(step.title, step.id)
    }

    for (const item of parsed.assignments || []) {
      await prisma.agentExecutionAssignment.create({
        data: {
          missionId: item.missionTitle
            ? missionTitleToId.get(item.missionTitle) || null
            : null,
          stepId: item.stepTitle ? stepTitleToId.get(item.stepTitle) || null : null,
          agentName: item.agentName,
          agentRole: item.agentRole || "execution-agent",
          instruction: item.instruction || null,
          confidence: item.confidence || 0.7,
          status: "assigned",
        },
      })
    }

    await prisma.operationalEvent.create({
      data: {
        type: "action-coordination-run",
        source: "action-engine",
        title: run.title,
        message: run.summary || null,
        severity:
          run.missionPressure >= 75
            ? "critical"
            : run.missionPressure >= 55
              ? "high"
              : "medium",
        entityType: "ActionCoordinationRun",
        entityId: run.id,
        payload: {
          runId: run.id,
          organizationId: org?.id || null,
          workspaceId: workspace?.id || null,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    console.error("Action coordination failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Action coordination failed",
      },
      { status: 500 }
    )
  }
}