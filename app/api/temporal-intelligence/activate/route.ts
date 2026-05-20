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

    const recommendation =
      await prisma.temporalRecommendation.findUnique({
        where: { id: body.recommendationId },
      })

    if (!recommendation) {
      return NextResponse.json(
        { ok: false, error: "Recommendation not found" },
        { status: 404 }
      )
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title: `Temporal Initiative: ${recommendation.title}`,
        description: recommendation.rationale || null,
        priority: recommendation.priority,
        status: "proposed",
        ownerSystem: "temporal-intelligence",
        targetOutcome:
          recommendation.expectedBenefit || "Strategic future optimization",
        executionPath: [
          "Validate temporal projection",
          "Align strategic execution",
          "Coordinate operations",
          "Measure future outcome trajectory",
        ],
        riskLevel:
          recommendation.priority === "high"
            ? "high"
            : "medium",
      },
    })

    const updated = await prisma.temporalRecommendation.update({
      where: { id: recommendation.id },
      data: {
        status: "activated",
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "temporal-recommendation-activated",
        source: "temporal-intelligence",
        title: recommendation.title,
        message: recommendation.rationale || null,
        severity:
          recommendation.priority === "high"
            ? "high"
            : "medium",
        entityType: "TemporalRecommendation",
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
    console.error("Temporal activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Temporal activation failed",
      },
      { status: 500 }
    )
  }
}