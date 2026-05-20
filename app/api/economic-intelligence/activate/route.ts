import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function activateOpportunity(opportunity: any) {
  const target = opportunity.targetSystem || "strategy"

  if (target === "email") {
    return prisma.emailExecution.create({
      data: {
        to: "dphogeorge@gmail.com",
        subject: `Revenue Opportunity: ${opportunity.title}`,
        body:
          `Economic Intelligence identified this revenue opportunity:\n\n${opportunity.description || ""}\n\nEstimated value: AUD ${opportunity.estimatedValue}\n\nExecution path:\n${JSON.stringify(opportunity.executionPath, null, 2)}`,
        status: "approval-required",
        approved: false,
        source: "economic-intelligence",
        riskLevel: opportunity.riskLevel,
        metadata: {
          opportunityId: opportunity.id,
        },
      },
    })
  }

  if (target === "workflow") {
    return prisma.workflowDefinition.create({
      data: {
        name: `Revenue Workflow: ${opportunity.title}`,
        description: opportunity.description || null,
        triggerType: "revenue-opportunity",
        enabled: true,
        riskLevel: opportunity.riskLevel,
        config: {
          opportunityId: opportunity.id,
          executionPath: opportunity.executionPath || [],
        },
      },
    })
  }

  if (target === "crm" || target === "revenue") {
    return prisma.creatorAutomationAction.create({
      data: {
        source: "economic-intelligence",
        title: opportunity.title,
        description: opportunity.description || null,
        actionType: "revenue_opportunity",
        priority: opportunity.priority,
        status: "pending",
        payload: {
          opportunityId: opportunity.id,
          estimatedValue: opportunity.estimatedValue,
          executionPath: opportunity.executionPath || [],
        },
      },
    })
  }

  return prisma.strategicInitiative.create({
    data: {
      title: `Revenue Initiative: ${opportunity.title}`,
      description: opportunity.description || null,
      priority: opportunity.priority,
      status: "proposed",
      ownerSystem: target,
      targetOutcome: `Capture estimated value of AUD ${opportunity.estimatedValue}`,
      executionPath: opportunity.executionPath || [],
      riskLevel: opportunity.riskLevel,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.type || !body.id) {
      return NextResponse.json(
        { ok: false, error: "type and id are required" },
        { status: 400 }
      )
    }

    if (body.type === "opportunity") {
      const opportunity = await prisma.revenueOpportunity.findUnique({
        where: { id: body.id },
      })

      if (!opportunity) {
        return NextResponse.json(
          { ok: false, error: "Opportunity not found" },
          { status: 404 }
        )
      }

      const result = await activateOpportunity(opportunity)

      const updated = await prisma.revenueOpportunity.update({
        where: { id: opportunity.id },
        data: {
          status: "activated",
          result,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "revenue-opportunity-activated",
          source: "economic-intelligence",
          title: opportunity.title,
          message: opportunity.description || null,
          severity: opportunity.priority === "high" ? "high" : "medium",
          entityType: "RevenueOpportunity",
          entityId: opportunity.id,
          payload: { result },
        },
      })

      return NextResponse.json({ ok: true, item: updated, result })
    }

    if (body.type === "campaign") {
      const campaign = await prisma.economicCampaign.update({
        where: { id: body.id },
        data: {
          status: "active",
          progressScore: 10,
        },
      })

      await prisma.executiveOperationCampaign.create({
        data: {
          title: `Economic Campaign: ${campaign.title}`,
          description: campaign.description || null,
          campaignType: campaign.campaignType,
          priority: campaign.priority,
          status: "active",
          strategicGoal: `Revenue goal: AUD ${campaign.revenueGoal}`,
          executionTempo: campaign.priority === "high" ? "fast" : "normal",
          targetSystems: ["revenue", "email", "workflow", "crm"],
          riskLevel: campaign.riskLevel,
          metadata: {
            economicCampaignId: campaign.id,
          },
        },
      })

      return NextResponse.json({ ok: true, item: campaign })
    }

    if (body.type === "decision") {
      const decision = await prisma.economicDecision.update({
        where: { id: body.id },
        data: {
          status: "accepted",
        },
      })

      await prisma.strategicDecisionLog.create({
        data: {
          title: `Economic Decision: ${decision.title}`,
          decision: decision.expectedImpact || decision.title,
          rationale: decision.rationale || null,
          status: "recorded",
          impactArea: "revenue",
          metadata: {
            economicDecisionId: decision.id,
          },
        },
      })

      return NextResponse.json({ ok: true, item: decision })
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported activation type" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Economic activation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Economic activation failed",
      },
      { status: 500 }
    )
  }
}