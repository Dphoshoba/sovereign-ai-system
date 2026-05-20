import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.email || !body.organizationId || !body.resource || !body.action) {
      return NextResponse.json(
        {
          ok: false,
          error: "email, organizationId, resource and action are required",
        },
        { status: 400 }
      )
    }

    const email = body.email.toLowerCase().trim()

    const user = await prisma.identityUser.findUnique({
      where: { email },
    })

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: body.organizationId,
        email,
        status: "active",
      },
    })

    const policy = await prisma.tenantAccessPolicy.findFirst({
      where: {
        organizationId: body.organizationId,
        resource: body.resource,
        action: body.action,
        status: "active",
      },
    })

    const allowedRoles = (policy?.allowedRoles as string[]) || ["owner"]
    const allowed = Boolean(member && allowedRoles.includes(member.role))

    const decision = await prisma.accessDecisionLog.create({
      data: {
        userId: user?.id || null,
        email,
        organizationId: body.organizationId,
        workspaceId: body.workspaceId || null,
        action: body.action,
        resource: body.resource,
        decision: allowed ? "allowed" : "denied",
        reason: allowed
          ? "Role matched tenant access policy."
          : "Role missing or not permitted for this resource/action.",
        role: member?.role || null,
        metadata: {
          allowedRoles,
          policyId: policy?.id || null,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      allowed,
      role: member?.role || null,
      policy,
      decision,
    })
  } catch (error) {
    console.error("Access check failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Access check failed",
      },
      { status: 500 }
    )
  }
}