import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.proposalId) {
      return NextResponse.json(
        { ok: false, error: "proposalId is required" },
        { status: 400 }
      )
    }

    const proposal = await prisma.evolutionImprovementProposal.findUnique({
      where: { id: body.proposalId },
    })

    if (!proposal) {
      return NextResponse.json(
        { ok: false, error: "Proposal not found" },
        { status: 404 }
      )
    }

    const initiative = await prisma.strategicInitiative.create({
      data: {
        title: `Optimization Initiative: ${proposal.title}`,
        description: proposal.description || null,
        priority:
          proposal.optimizationValue >= 85
            ? "high"
            : proposal.optimizationValue >= 65
              ? "medium"
              : "low",
        status: "proposed",
        ownerSystem: "evolution-engine",
        targetOutcome:
          proposal.expectedImpact ||
          "Improve institutional operational maturity.",
        executionPath: [
          "Review optimization proposal",
          "Validate governance alignment",
          "Assign execution owner",
          "Implement controlled rollout",
          "Measure operational delta",
          "Store institutional learning",
        ],
        riskLevel:
          proposal.riskLevel === "critical"
            ? "high"
            : proposal.riskLevel,
      },
    })

    const updated = await prisma.evolutionImprovementProposal.update({
      where: { id: proposal.id },
      data: {
        status: "activated",
        payload: {
          ...(proposal.payload as any),
          initiativeId: initiative.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      proposal: updated,
      initiative,
    })
  } catch (error) {
    console.error("Proposal activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Proposal activation failed",
      },
      { status: 500 }
    )
  }
}