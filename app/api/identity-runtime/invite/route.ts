import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.organizationId || !body.email) {
      return NextResponse.json(
        { ok: false, error: "organizationId and email are required" },
        { status: 400 }
      )
    }

    const org = await prisma.sovereignOrganization.findUnique({
      where: { id: body.organizationId },
    })

    if (!org) {
      return NextResponse.json(
        { ok: false, error: "Organization not found" },
        { status: 404 }
      )
    }

    const token = crypto.randomBytes(24).toString("hex")

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: org.id,
        email: body.email.toLowerCase().trim(),
        role: body.role || "member",
        invitedBy: body.invitedBy || "davidoshoba@gmail.com",
        token,
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        metadata: {
          orgSlug: org.slug,
        },
      },
    })

    await prisma.tenantIntelligenceRecord.create({
      data: {
        organizationId: org.id,
        recordType: "member-invited",
        title: `Invitation sent to ${invitation.email}`,
        summary: `Invited as ${invitation.role}.`,
        sourceLayer: "identity-runtime",
        priority: "medium",
        payload: {
          invitationId: invitation.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      invitation,
      inviteLink: `/invite/${token}`,
    })
  } catch (error) {
    console.error("Invitation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invitation failed",
      },
      { status: 500 }
    )
  }
}