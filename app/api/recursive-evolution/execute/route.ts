import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function executeProposal(proposal: any) {
  const payload = proposal.payload || {}

  if (proposal.proposalType === "operations") {
    return prisma.executiveOperationCampaign.create({
      data: {
        title: payload.title || proposal.title,
        description:
          proposal.rationale || payload.description || null,
        campaignType: "self-optimization",
        priority:
          proposal.implementationRisk === "high"
            ? "high"
            : "medium",
        status: "active",
        strategicGoal:
          proposal.expectedBenefit || "Institutional optimization",
        executionTempo: "normal",
        targetSystems: [proposal.targetSystem || "operations"],
        riskLevel: proposal.implementationRisk || "medium",
      },
    })
  }

  if (proposal.proposalType === "governance") {
    return prisma.governanceApproval.create({
      data: {
        title: proposal.title,
        targetType: "recursive-evolution",
        targetId: proposal.id,
        priority:
          proposal.implementationRisk === "high"
            ? "high"
            : "medium",
        rationale:
          proposal.rationale || "Governance evolution proposal",
        status: "pending",
      },
    })
  }

  if (proposal.proposalType === "economics") {
    return prisma.economicCampaign.create({
      data: {
        title: payload.title || proposal.title,
        description:
          proposal.expectedBenefit || proposal.rationale || null,
        campaignType: "optimization",
        revenueGoal: 0,
        priority: "medium",
        status: "planned",
        riskLevel: proposal.implementationRisk || "medium",
        targetAudience: "internal organization",
        strategy: payload || {},
      },
    })
  }

  return prisma.strategicInitiative.create({
    data: {
      title: `Evolution Initiative: ${proposal.title}`,
      description: proposal.rationale || null,
      priority:
        proposal.implementationRisk === "high"
          ? "high"
          : "medium",
      status: "proposed",
      ownerSystem: "recursive-evolution",
      targetOutcome:
        proposal.expectedBenefit || "Institutional optimization",
      executionPath:
        proposal.executionPlan || [
          "Validate proposal",
          "Coordinate governance",
          "Execute safely",
          "Measure impact",
        ],
      riskLevel: proposal.implementationRisk || "medium",
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.proposalId) {
      return NextResponse.json(
        { ok: false, error: "proposalId is required" },
        { status: 400 }
      )
    }

    const proposal =
      await prisma.selfOptimizationProposal.findUnique({
        where: { id: body.proposalId },
      })

    if (!proposal) {
      return NextResponse.json(
        { ok: false, error: "Proposal not found" },
        { status: 404 }
      )
    }

    const result = await executeProposal(proposal)

    const updated = await prisma.selfOptimizationProposal.update({
      where: { id: proposal.id },
      data: {
        status: "executed",
        result,
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "recursive-proposal-executed",
        source: "recursive-evolution-engine",
        title: proposal.title,
        message: proposal.rationale || null,
        severity:
          proposal.implementationRisk === "high"
            ? "high"
            : "medium",
        entityType: "SelfOptimizationProposal",
        entityId: proposal.id,
      },
    })

    return NextResponse.json({
      ok: true,
      proposal: updated,
      result,
    })
  } catch (error) {
    console.error("Proposal execution failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Proposal execution failed",
      },
      { status: 500 }
    )
  }
}