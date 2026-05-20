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

    const recommendation = await prisma.worldModelRecommendation.findUnique({
      where: { id: body.recommendationId },
    })

    if (!recommendation) {
      return NextResponse.json(
        { ok: false, error: "World model recommendation not found" },
        { status: 404 }
      )
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title: `World Model Initiative: ${recommendation.title}`,
        description: recommendation.rationale || null,
        priority: recommendation.priority,
        status: "proposed",
        ownerSystem: "world-model",
        targetOutcome:
          recommendation.expectedBenefit ||
          "Improve strategic positioning from world-model intelligence.",
        executionPath: [
          "Review world-model assumption set",
          "Validate signal relevance",
          "Coordinate governance review",
          "Activate strategic response",
          "Monitor outcome against future signals",
        ],
        riskLevel: recommendation.priority === "high" ? "high" : "medium",
      },
    })

    const updated = await prisma.worldModelRecommendation.update({
      where: { id: recommendation.id },
      data: {
        status: "activated",
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "world-model-recommendation-activated",
        source: "world-model",
        title: recommendation.title,
        message: recommendation.rationale || null,
        severity: recommendation.priority === "high" ? "high" : "medium",
        entityType: "WorldModelRecommendation",
        entityId: recommendation.id,
        payload: {
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
    console.error("World model activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "World model activation failed",
      },
      { status: 500 }
    )
  }
}