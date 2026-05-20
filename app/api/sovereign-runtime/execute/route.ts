import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeSovereignAction(action: any) {
  const payload = action.payload || {}

  if (action.actionType === "create-governance-review") {
    return prisma.governanceRiskSignal.create({
      data: {
        title: payload.title || action.title,
        signalType: "sovereign-runtime-review",
        severity:
          action.priority === "critical"
            ? "critical"
            : action.priority === "high"
              ? "high"
              : "medium",
        affectedArea: action.targetLayer,
        description: action.rationale || null,
        recommendation:
          payload.recommendation ||
          "Review this runtime signal before further autonomous execution.",
        status: "open",
      },
    })
  }

  if (action.actionType === "create-strategic-initiative") {
    return prisma.strategicInitiative.create({
      data: {
        title: payload.title || action.title,
        description: action.rationale || null,
        priority: action.priority === "critical" ? "high" : action.priority,
        status: "proposed",
        ownerSystem: "sovereign-runtime",
        targetOutcome:
          payload.targetOutcome ||
          "Improve unified executive runtime performance.",
        executionPath:
          payload.executionPath || [
            "Review runtime priority",
            "Validate governance implications",
            "Coordinate execution layer",
            "Measure effect",
          ],
        riskLevel:
          action.priority === "critical"
            ? "high"
            : action.priority === "high"
              ? "high"
              : "medium",
      },
    })
  }

  if (action.actionType === "create-runtime-objective") {
    return prisma.runtimeObjective.create({
      data: {
        title: payload.title || action.title,
        description: action.rationale || null,
        priority: action.priority === "critical" ? "high" : action.priority,
        cadence: payload.cadence || "daily",
        status: "active",
        metadata: {
          source: "sovereign-runtime",
          sovereignActionId: action.id,
          ...payload,
        },
      },
    })
  }

  if (action.actionType === "create-economic-campaign") {
    return prisma.economicCampaign.create({
      data: {
        title: payload.title || action.title,
        description: action.rationale || null,
        campaignType: payload.campaignType || "strategic-revenue",
        revenueGoal:
          typeof payload.revenueGoal === "number" ? payload.revenueGoal : 0,
        priority: action.priority === "critical" ? "high" : action.priority,
        status: "planned",
        riskLevel:
          action.priority === "critical"
            ? "high"
            : action.priority === "high"
              ? "high"
              : "medium",
        targetAudience: payload.targetAudience || "priority market",
        strategy: payload.strategy || {},
      },
    })
  }

  if (action.actionType === "store-memory") {
    return prisma.creatorLearningMemory.create({
      data: {
        type: "sovereign-runtime",
        title: payload.title || action.title,
        insight: action.rationale || action.title,
        confidence: 0.82,
        priority: action.priority === "critical" ? "high" : action.priority,
        status: "active",
        evidence: {
          sovereignActionId: action.id,
          targetLayer: action.targetLayer,
        },
      },
    })
  }

  return prisma.operationalEvent.create({
    data: {
      type: "sovereign-runtime-manual-review",
      source: "sovereign-runtime",
      title: action.title,
      message: action.rationale || null,
      severity:
        action.priority === "critical"
          ? "critical"
          : action.priority === "high"
            ? "high"
            : "medium",
      entityType: "SovereignRuntimeAction",
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

    const action = await prisma.sovereignRuntimeAction.findUnique({
      where: { id: body.actionId },
    })

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "Sovereign runtime action not found" },
        { status: 404 }
      )
    }

    const result = await executeSovereignAction(action)

    const updated = await prisma.sovereignRuntimeAction.update({
      where: { id: action.id },
      data: {
        status: "executed",
        result,
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "sovereign-runtime-action-executed",
        source: "sovereign-runtime",
        title: action.title,
        message: action.rationale || null,
        severity:
          action.priority === "critical"
            ? "critical"
            : action.priority === "high"
              ? "high"
              : "medium",
        entityType: "SovereignRuntimeAction",
        entityId: action.id,
      },
    })

    return NextResponse.json({
      ok: true,
      action: updated,
      result,
    })
  } catch (error) {
    console.error("Sovereign runtime action failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Sovereign runtime action failed",
      },
      { status: 500 }
    )
  }
}