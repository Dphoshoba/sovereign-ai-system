import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.requestId || !body.action) {
      return NextResponse.json(
        { ok: false, error: "requestId and action are required" },
        { status: 400 }
      )
    }

    const authRequest =
      await prisma.executionAuthorizationRequest.findUnique({
        where: { id: body.requestId },
      })

    if (!authRequest) {
      return NextResponse.json(
        { ok: false, error: "Authorization request not found" },
        { status: 404 }
      )
    }

    const actorEmail = body.actorEmail || "davidoshoba@gmail.com"

    const actor = await prisma.governanceActor.findFirst({
      where: { email: actorEmail, status: "active" },
    })

    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "Active governance actor not found" },
        { status: 403 }
      )
    }

    const role = await prisma.governanceRole.findFirst({
      where: { name: actor.roleName || "" },
    })

    const isHighRisk = ["high", "critical"].includes(authRequest.riskLevel)

    if (isHighRisk && (role?.authorityLevel || 0) < 10) {
      await prisma.governanceAuditTrail.create({
        data: {
          eventType: "authorization-denied-insufficient-authority",
          actor: actor.email,
          actorRole: actor.roleName,
          targetType: authRequest.targetType,
          targetId: authRequest.targetId,
          action: authRequest.actionType,
          outcome: "denied",
          severity: authRequest.riskLevel,
          details: {
            requestId: authRequest.id,
            authorityLevel: role?.authorityLevel || 0,
          },
        },
      })

      return NextResponse.json(
        { ok: false, error: "Insufficient authority for high-risk approval" },
        { status: 403 }
      )
    }

    const approved = body.action === "approve"

    const updated = await prisma.executionAuthorizationRequest.update({
      where: { id: authRequest.id },
      data: {
        status: approved ? "approved" : "rejected",
        approvedBy: approved ? actor.email : null,
        rejectedBy: approved ? null : actor.email,
        decisionNotes: body.notes || null,
      },
    })

    await prisma.governanceAuditTrail.create({
      data: {
        eventType: "authorization-decision",
        actor: actor.email,
        actorRole: actor.roleName,
        targetType: authRequest.targetType,
        targetId: authRequest.targetId,
        action: authRequest.actionType,
        outcome: updated.status,
        severity: authRequest.riskLevel,
        details: {
          requestId: authRequest.id,
          notes: body.notes || null,
        },
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "authorization-decision",
        source: "enterprise-governance",
        title: updated.title,
        message: `Authorization ${updated.status}`,
        severity:
          updated.riskLevel === "critical"
            ? "critical"
            : updated.riskLevel === "high"
              ? "high"
              : "medium",
        entityType: "ExecutionAuthorizationRequest",
        entityId: updated.id,
        payload: {
          status: updated.status,
          actor: actor.email,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      request: updated,
    })
  } catch (error) {
    console.error("Governance decision failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Governance decision failed",
      },
      { status: 500 }
    )
  }
}