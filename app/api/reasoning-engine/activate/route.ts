import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.recommendationId) {
      return NextResponse.json(
        { ok: false, error: "recommendationId is required" },
        { status: 400 }
      )
    }

    const recommendation = await prisma.reasoningRecommendation.findUnique({
      where: { id: body.recommendationId },
    })

    if (!recommendation) {
      return NextResponse.json(
        { ok: false, error: "Recommendation not found" },
        { status: 404 }
      )
    }

    if (recommendation.requiredApproval) {
      const auth = await prisma.executionAuthorizationRequest.create({
        data: {
          title: `Approve Reasoning Recommendation: ${recommendation.title}`,
          targetType: "ReasoningRecommendation",
          targetId: recommendation.id,
          requestedBy: "reasoning-engine",
          requestedRole: "system",
          actionType: "activate-recommendation",
          targetLayer: recommendation.recommendationType,
          riskLevel:
            recommendation.priority === "critical"
              ? "critical"
              : recommendation.priority === "high"
                ? "high"
                : "medium",
          status: "pending",
          rationale: recommendation.rationale || null,
          payload: {
            recommendationId: recommendation.id,
            expectedOutcome: recommendation.expectedOutcome,
          },
        },
      })

      const updated = await prisma.reasoningRecommendation.update({
        where: { id: recommendation.id },
        data: {
          status: "approval-requested",
        },
      })

      return NextResponse.json({
        ok: true,
        recommendation: updated,
        authorizationRequest: auth,
      })
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title: `Reasoned Initiative: ${recommendation.title}`,
        description: recommendation.rationale || null,
        priority:
          recommendation.priority === "critical" ? "high" : recommendation.priority,
        status: "proposed",
        ownerSystem: "reasoning-engine",
        targetOutcome:
          recommendation.expectedOutcome ||
          "Execute reasoned strategic recommendation.",
        executionPath: [
          "Review reasoning trace",
          "Validate assumptions",
          "Coordinate owner",
          "Execute controlled next step",
          "Measure outcome",
        ],
        riskLevel:
          recommendation.priority === "critical" || recommendation.priority === "high"
            ? "high"
            : "medium",
      },
    })

    const updated = await prisma.reasoningRecommendation.update({
      where: { id: recommendation.id },
      data: {
        status: "activated",
        payload: {
          ...(recommendation.payload as any),
          initiativeId: initiative.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      recommendation: updated,
      initiative,
    })
  } catch (error) {
    console.error("Reasoning recommendation activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Recommendation activation failed",
      },
      { status: 500 }
    )
  }
}