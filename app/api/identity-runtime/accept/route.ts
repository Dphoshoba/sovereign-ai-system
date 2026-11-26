import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const INVITATION_TOKEN = /^[a-f0-9]{48}$/

class InvitationClaimRejected extends Error {
  constructor() {
    super("Invitation claim rejected")
    this.name = "InvitationClaimRejected"
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = typeof body?.token === "string" ? body.token : ""
    const displayName =
      typeof body?.name === "string" ? body.name.trim().slice(0, 120) : ""

    if (!INVITATION_TOKEN.test(token)) {
      return NextResponse.json(
        { ok: false, error: "A valid invitation token is required" },
        { status: 400 }
      )
    }

    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token },
    })

    if (!invitation || invitation.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    if (!invitation.expiresAt || invitation.expiresAt < new Date()) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      })

      return NextResponse.json(
        { ok: false, error: "Invitation expired" },
        { status: 410 }
      )
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.organizationInvitation.updateMany({
        where: {
          id: invitation.id,
          status: "pending",
          expiresAt: { gt: new Date() },
        },
        data: {
          status: "accepted",
          acceptedAt: new Date(),
        },
      })

      if (claimed.count !== 1) throw new InvitationClaimRejected()

      let user = await tx.identityUser.findUnique({
        where: { email: invitation.email },
      })

      if (!user) {
        user = await tx.identityUser.create({
          data: {
            email: invitation.email,
            name: displayName || null,
            defaultOrgId: invitation.organizationId,
          },
        })
      }

      const existingMember = await tx.organizationMember.findFirst({
        where: {
          organizationId: invitation.organizationId,
          email: invitation.email,
        },
      })

      if (existingMember) {
        await tx.organizationMember.update({
          where: { id: existingMember.id },
          data: {
            role: invitation.role,
            status: "active",
          },
        })
      } else {
        await tx.organizationMember.create({
          data: {
            organizationId: invitation.organizationId,
            email: invitation.email,
            name: displayName || user.name,
            role: invitation.role,
            permissions: {
              invited: true,
            },
          },
        })
      }

      await tx.accessDecisionLog.create({
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
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof InvitationClaimRejected) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation" },
        { status: 404 }
      )
    }

    console.error("Invitation accept failed")

    return NextResponse.json(
      { ok: false, error: "Invitation accept failed" },
      { status: 500 }
    )
  }
}