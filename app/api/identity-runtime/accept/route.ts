import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.token) {
      return NextResponse.json(
        { ok: false, error: "token is required" },
        { status: 400 }
      )
    }

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token: body.token },
    })

    if (!invitation || invitation.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      })

      return NextResponse.json(
        { ok: false, error: "Invitation expired" },
        { status: 410 }
      )
    }

    let user = await prisma.identityUser.findUnique({
      where: { email: invitation.email },
    })

    if (!user) {
      user = await prisma.identityUser.create({
        data: {
          email: invitation.email,
          name: body.name || null,
          defaultOrgId: invitation.organizationId,
        },
      })
    }

    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: invitation.organizationId,
        email: invitation.email,
      },
    })

    const member = existingMember
      ? await prisma.organizationMember.update({
          where: { id: existingMember.id },
          data: {
            role: invitation.role,
            status: "active",
          },
        })
      : await prisma.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            email: invitation.email,
            name: body.name || user.name,
            role: invitation.role,
            permissions: {
              invited: true,
            },
          },
        })

    const updatedInvitation = await prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    })

    await prisma.accessDecisionLog.create({
      data: {
        userId: user.id,
        email: user.email,
        organizationId: invitation.organizationId,
        action: "accept-invitation",
        resource: "organization",
        decision: "allowed",
        reason: "Invitation accepted.",
        role: invitation.role,
        metadata: {
          invitationId: invitation.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      user,
      member,
      invitation: updatedInvitation,
    })
  } catch (error) {
    console.error("Invitation accept failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Invitation accept failed",
      },
      { status: 500 }
    )
  }
}