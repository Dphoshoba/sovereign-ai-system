import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function applyPolicy(policy: any) {
  const payload = policy.payload || {}

  if (policy.policyArea === "retry") {
    return prisma.runtimeObjective.create({
      data: {
        title: payload.title || "Improve retry discipline",
        description:
          payload.description ||
          policy.recommendation ||
          "Review retry failures and improve recovery behavior.",
        priority: policy.priority,
        cadence: "daily",
        status: "active",
        metadata: payload,
      },
    })
  }

  if (policy.policyArea === "workflow") {
    return prisma.optimizationAction.create({
      data: {
        title: payload.title || policy.title,
        description: policy.recommendation,
        actionType: "recommend_process_change",
        targetSystem: "workflow",
        priority: policy.priority,
        riskLevel: policy.riskLevel,
        status: "proposed",
        payload,
      },
    })
  }

  if (policy.policyArea === "agent") {
    const agent = await prisma.executiveAgent.findFirst({
      where: { name: payload.agentName || undefined },
    })

    if (!agent) {
      return prisma.operationalEvent.create({
        data: {
          type: "agent-policy-review",
          source: "adaptive-evolution",
          title: policy.title,
          message: policy.recommendation,
          severity: policy.priority === "high" ? "high" : "medium",
          payload,
        },
      })
    }

    return prisma.agentDelegation.create({
      data: {
        fromAgentId: agent.id,
        fromAgentName: agent.name,
        toAgentId: agent.id,
        toAgentName: agent.name,
        task: policy.recommendation,
        context: "Adaptive evolution policy recommendation.",
        priority: policy.priority,
        status: "pending",
      },
    })
  }

  if (policy.policyArea === "email") {
    return prisma.emailExecution.create({
      data: {
        to: payload.to || "dphogeorge@gmail.com",
        subject: payload.subject || policy.title,
        body:
          payload.body ||
          `Adaptive Evolution Recommendation:\n\n${policy.recommendation}`,
        status: "approval-required",
        approved: false,
        source: "adaptive-evolution",
        riskLevel: policy.riskLevel,
        metadata: payload,
      },
    })
  }

  if (policy.policyArea === "governance") {
    return prisma.operationalEvent.create({
      data: {
        type: "governance-policy-recommendation",
        source: "adaptive-evolution",
        title: policy.title,
        message: policy.recommendation,
        severity: policy.priority === "high" ? "high" : "medium",
        entityType: "EvolutionPolicyRecommendation",
        entityId: policy.id,
        payload,
      },
    })
  }

  return prisma.creatorLearningMemory.create({
    data: {
      type: "adaptive-evolution",
      title: policy.title,
      insight: policy.recommendation,
      confidence: 0.75,
      priority: policy.priority,
      status: "active",
      evidence: {
        policyId: policy.id,
        policyArea: policy.policyArea,
      },
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.policyId) {
      return NextResponse.json(
        { ok: false, error: "policyId is required" },
        { status: 400 }
      )
    }

    const policy = await prisma.evolutionPolicyRecommendation.findUnique({
      where: { id: body.policyId },
    })

    if (!policy) {
      return NextResponse.json(
        { ok: false, error: "Policy recommendation not found" },
        { status: 404 }
      )
    }

    if (!["proposed", "approved"].includes(policy.status)) {
      return NextResponse.json(
        { ok: false, error: "Policy cannot apply in current status" },
        { status: 400 }
      )
    }

    try {
      const result = await applyPolicy(policy)

      const updated = await prisma.evolutionPolicyRecommendation.update({
        where: { id: policy.id },
        data: {
          status: "applied",
          result,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "evolution-policy-applied",
          source: "adaptive-evolution",
          title: policy.title,
          message: policy.recommendation,
          severity: "info",
          entityType: "EvolutionPolicyRecommendation",
          entityId: policy.id,
          payload: { result },
        },
      })

      return NextResponse.json({
        ok: true,
        policy: updated,
        result,
      })
    } catch (executionError) {
      const failed = await prisma.evolutionPolicyRecommendation.update({
        where: { id: policy.id },
        data: {
          status: "failed",
          error:
            executionError instanceof Error
              ? executionError.message
              : "Policy application failed",
        },
      })

      return NextResponse.json(
        {
          ok: false,
          policy: failed,
          error:
            executionError instanceof Error
              ? executionError.message
              : "Policy application failed",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Adaptive policy apply failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Adaptive policy apply failed",
      },
      { status: 500 }
    )
  }
}