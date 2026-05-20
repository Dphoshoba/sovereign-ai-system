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

    const recommendation = await prisma.planetaryRecommendationV2.findUnique({
      where: { id: body.recommendationId },
    })

    if (!recommendation) {
      return NextResponse.json(
        { ok: false, error: "Planetary recommendation not found" },
        { status: 404 }
      )
    }

    if (recommendation.status === "activated") {
      return NextResponse.json(
        { ok: false, error: "Recommendation is already activated" },
        { status: 400 }
      )
    }

    if (recommendation.status === "approval-requested") {
      return NextResponse.json(
        {
          ok: false,
          error: "Approval request already pending in Enterprise Governance",
        },
        { status: 409 }
      )
    }

    if (recommendation.requiredApproval) {
      const auth = await prisma.executionAuthorizationRequest.create({
        data: {
          title: `Approve Planetary Recommendation: ${recommendation.title}`,
          targetType: "PlanetaryRecommendationV2",
          targetId: recommendation.id,
          requestedBy: "world-model-v2",
          requestedRole: "system",
          actionType: "activate-planetary-recommendation",
          targetLayer: recommendation.recommendationType,
          riskLevel:
            recommendation.priority === "critical"
              ? "critical"
              : recommendation.priority === "high"
                ? "high"
                : recommendation.riskScore >= 70
                  ? "high"
                  : "medium",
          status: "pending",
          rationale: recommendation.rationale || null,
          payload: {
            recommendationId: recommendation.id,
            runId: recommendation.runId,
            expectedOutcome: recommendation.expectedOutcome,
            scores: {
              urgency: recommendation.urgencyScore,
              opportunity: recommendation.opportunityScore,
              risk: recommendation.riskScore,
              governanceSensitivity: recommendation.governanceSensitivityScore,
              composite: recommendation.compositeScore,
            },
          },
        },
      })

      const updated = await prisma.planetaryRecommendationV2.update({
        where: { id: recommendation.id },
        data: { status: "approval-requested" },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "world-model-v2-approval-requested",
          source: "world-model-v2",
          title: recommendation.title,
          message: recommendation.rationale || null,
          severity:
            recommendation.riskScore >= 75 ? "critical" : "high",
          entityType: "PlanetaryRecommendationV2",
          entityId: recommendation.id,
          payload: { authorizationRequestId: auth.id },
        },
      })

      return NextResponse.json({
        ok: true,
        recommendation: updated,
        authorizationRequest: auth,
        governanceRequired: true,
      })
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title: `Planetary Initiative: ${recommendation.title}`,
        description: recommendation.rationale || null,
        priority:
          recommendation.priority === "critical"
            ? "high"
            : recommendation.priority,
        status: "proposed",
        ownerSystem: "world-model-v2",
        targetOutcome:
          recommendation.expectedOutcome ||
          "Execute governed planetary strategic recommendation.",
        executionPath: [
          "Review planetary domain signals",
          "Validate stress test resilience",
          "Coordinate governance if sensitivity rises",
          "Activate strategic initiative",
          "Monitor shock indicators",
        ],
        riskLevel:
          recommendation.riskScore >= 70 || recommendation.priority === "high"
            ? "high"
            : "medium",
      },
    })

    const updated = await prisma.planetaryRecommendationV2.update({
      where: { id: recommendation.id },
      data: {
        status: "activated",
        payload: {
          ...((recommendation.payload as Record<string, unknown>) || {}),
          initiativeId: initiative.id,
        },
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "world-model-v2-recommendation-activated",
        source: "world-model-v2",
        title: recommendation.title,
        message: recommendation.rationale || null,
        severity: recommendation.riskScore >= 70 ? "high" : "medium",
        entityType: "PlanetaryRecommendationV2",
        entityId: recommendation.id,
        payload: { initiativeId: initiative.id },
      },
    })

    return NextResponse.json({
      ok: true,
      recommendation: updated,
      initiative,
      governanceRequired: false,
    })
  } catch (error) {
    console.error("World model V2 activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Planetary recommendation activation failed",
      },
      { status: 500 }
    )
  }
}
