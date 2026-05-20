import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const starterRoles = [
  {
    name: "Founder",
    description: "Full strategic and governance authority.",
    authorityLevel: 10,
    permissions: {
      approveHighRisk: true,
      approveEconomicActions: true,
      approveGovernanceChanges: true,
      executeRuntimeActions: true,
    },
  },
  {
    name: "Executive Operator",
    description: "Can approve medium-risk operational actions.",
    authorityLevel: 6,
    permissions: {
      approveMediumRisk: true,
      executeRuntimeActions: true,
    },
  },
  {
    name: "Observer",
    description: "Can view intelligence but cannot approve execution.",
    authorityLevel: 2,
    permissions: {
      readOnly: true,
    },
  },
]

const starterPolicies = [
  {
    title: "Human approval required for high-risk execution",
    description: "Any high or critical risk action requires human approval before execution.",
    policyArea: "execution",
    ruleType: "risk-control",
    enforcement: "approval-required",
    severity: "high",
    conditions: {
      riskLevels: ["high", "critical"],
    },
    allowedRoles: ["Founder"],
    blockedActions: [],
  },
  {
    title: "AI cannot self-authorize governance changes",
    description: "Governance policy changes must be approved by the Founder.",
    policyArea: "governance",
    ruleType: "authority-boundary",
    enforcement: "strict",
    severity: "critical",
    conditions: {
      targetLayer: "governance",
    },
    allowedRoles: ["Founder"],
    blockedActions: ["self-approve", "auto-execute"],
  },
  {
    title: "External communication requires review",
    description: "Emails and external actions must remain approval-aware.",
    policyArea: "communications",
    ruleType: "external-action-control",
    enforcement: "approval-required",
    severity: "medium",
    conditions: {
      targetLayer: "email",
    },
    allowedRoles: ["Founder", "Executive Operator"],
    blockedActions: ["send-without-approval"],
  },
]

async function seedGovernance() {
  const roles = await prisma.governanceRole.findMany()

  if (roles.length === 0) {
    await prisma.governanceRole.createMany({
      data: starterRoles,
    })
  }

  const policies = await prisma.constitutionalPolicy.findMany()

  if (policies.length === 0) {
    await prisma.constitutionalPolicy.createMany({
      data: starterPolicies,
    })
  }

  const founder = await prisma.governanceActor.findFirst({
    where: { email: "davidoshoba@gmail.com" },
  })

  if (!founder) {
    const founderRole = await prisma.governanceRole.findUnique({
      where: { name: "Founder" },
    })

    await prisma.governanceActor.create({
      data: {
        name: "David George",
        email: "davidoshoba@gmail.com",
        actorType: "human",
        roleId: founderRole?.id || null,
        roleName: "Founder",
        status: "active",
      },
    })
  }
}

export async function GET() {
  try {
    await seedGovernance()

    const [roles, actors, policies, requests, auditTrail] = await Promise.all([
      prisma.governanceRole.findMany({
        orderBy: { authorityLevel: "desc" },
      }),
      prisma.governanceActor.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.constitutionalPolicy.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.executionAuthorizationRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
      prisma.governanceAuditTrail.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ])

    return NextResponse.json({
      ok: true,
      roles,
      actors,
      policies,
      requests,
      auditTrail,
    })
  } catch (error) {
    console.error("Enterprise governance fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch enterprise governance OS" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await seedGovernance()

    const body = await request.json()

    if (!body.title || !body.actionType || !body.targetType) {
      return NextResponse.json(
        { ok: false, error: "title, actionType and targetType are required" },
        { status: 400 }
      )
    }

    const policies = await prisma.constitutionalPolicy.findMany({
      where: { status: "active" },
    })

    const matchedPolicies = policies.filter((policy) => {
      const conditions = policy.conditions as any
      const riskLevels = conditions?.riskLevels as string[] | undefined
      const targetLayer = conditions?.targetLayer as string | undefined

      const riskMatch = riskLevels?.includes(body.riskLevel || "medium")
      const layerMatch = targetLayer && targetLayer === body.targetLayer

      return Boolean(riskMatch || layerMatch)
    })

    const requiresApproval =
      matchedPolicies.length > 0 ||
      ["high", "critical"].includes(body.riskLevel || "medium")

    const authRequest = await prisma.executionAuthorizationRequest.create({
      data: {
        title: body.title,
        targetType: body.targetType,
        targetId: body.targetId || null,
        requestedBy: body.requestedBy || "system",
        requestedRole: body.requestedRole || null,
        actionType: body.actionType,
        targetLayer: body.targetLayer || null,
        riskLevel: body.riskLevel || "medium",
        status: requiresApproval ? "pending" : "auto-approved",
        rationale: body.rationale || null,
        policyMatches: matchedPolicies.map((p) => ({
          id: p.id,
          title: p.title,
          enforcement: p.enforcement,
          severity: p.severity,
        })),
        payload: body.payload || {},
      },
    })

    await prisma.governanceAuditTrail.create({
      data: {
        eventType: "authorization-request-created",
        actor: body.requestedBy || "system",
        actorRole: body.requestedRole || "system",
        targetType: body.targetType,
        targetId: body.targetId || null,
        action: body.actionType,
        outcome: authRequest.status,
        severity: body.riskLevel || "medium",
        details: {
          requestId: authRequest.id,
          matchedPolicies: matchedPolicies.length,
        },
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "authorization-request-created",
        source: "enterprise-governance",
        title: authRequest.title,
        message: authRequest.rationale || null,
        severity:
          authRequest.riskLevel === "critical"
            ? "critical"
            : authRequest.riskLevel === "high"
              ? "high"
              : "medium",
        entityType: "ExecutionAuthorizationRequest",
        entityId: authRequest.id,
        payload: {
          requestId: authRequest.id,
          status: authRequest.status,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      request: authRequest,
    })
  } catch (error) {
    console.error("Authorization request failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Authorization request failed",
      },
      { status: 500 }
    )
  }
}