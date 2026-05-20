import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeFederationAction(action: any) {
  const payload = action.payload || {}

  if (action.actionType === "create-strategic-initiative") {
    return prisma.strategicInitiative.create({
      data: {
        title: payload.title || action.title,
        description: payload.description || action.rationale || null,
        priority: action.priority,
        status: "proposed",
        ownerSystem: "federated-intelligence",
        targetOutcome: payload.targetOutcome || "Federated strategic coordination.",
        executionPath: payload.executionPath || [
          "Review federation signal",
          "Validate institutional alignment",
          "Coordinate with relevant node",
          "Monitor outcome",
        ],
        riskLevel: action.priority === "high" ? "high" : "medium",
      },
    })
  }

  if (action.actionType === "create-economic-campaign") {
    return prisma.economicCampaign.create({
      data: {
        title: payload.title || action.title,
        description: payload.description || action.rationale || null,
        campaignType: payload.campaignType || "market-campaign",
        revenueGoal: typeof payload.revenueGoal === "number" ? payload.revenueGoal : 0,
        priority: action.priority,
        status: "planned",
        riskLevel: action.priority === "high" ? "high" : "medium",
        targetAudience: payload.targetAudience || "creator market",
        strategy: payload.strategy || {},
      },
    })
  }

  if (action.actionType === "create-governance-review") {
    return prisma.governanceRiskSignal.create({
      data: {
        title: payload.title || action.title,
        signalType: "federation-governance-risk",
        severity: action.priority === "high" ? "high" : "medium",
        affectedArea: action.targetNode || "federation",
        description: action.rationale || null,
        recommendation: payload.recommendation || "Review federation action before expansion.",
        status: "open",
      },
    })
  }

  if (action.actionType === "store-memory") {
    return prisma.creatorLearningMemory.create({
      data: {
        type: "federated-intelligence",
        title: payload.title || action.title,
        insight: action.rationale || payload.insight || action.title,
        confidence: 0.75,
        priority: action.priority,
        status: "active",
        evidence: {
          federationActionId: action.id,
          targetNode: action.targetNode,
        },
      },
    })
  }

  return prisma.operationalEvent.create({
    data: {
      type: "federation-action-executed",
      source: "federated-intelligence",
      title: action.title,
      message: action.rationale || null,
      severity: action.priority === "high" ? "high" : "medium",
      entityType: "FederationAction",
      entityId: action.id,
      payload,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.actionId) {
      return NextResponse.json(
        { ok: false, error: "actionId is required" },
        { status: 400 }
      )
    }

    const action = await prisma.federationAction.findUnique({
      where: { id: body.actionId },
    })

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Federation action not found" },
        { status: 404 }
      )
    }

    const result = await executeFederationAction(action)

    const updated = await prisma.federationAction.update({
      where: { id: action.id },
      data: {
        status: "executed",
        result,
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "federation-action-completed",
        source: "federated-intelligence",
        title: action.title,
        message: action.rationale || null,
        severity: "info",
        entityType: "FederationAction",
        entityId: action.id,
      },
    })

    return NextResponse.json({
      ok: true,
      action: updated,
      result,
    })
  } catch (error) {
    console.error("Federation action execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Federation action execution failed",
      },
      { status: 500 }
    )
  }
}