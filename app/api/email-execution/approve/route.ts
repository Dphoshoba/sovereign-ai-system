import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.emailId) {
      return NextResponse.json(
        { ok: false, error: "emailId is required" },
        { status: 400 }
      )
    }

    const email = await prisma.emailExecution.update({
      where: { id: body.emailId },
      data: {
        approved: true,
        status: "queued",
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "email-approved",
        source: "email-execution",
        title: `Email approved: ${email.subject}`,
        message: `Approved email to ${email.to}`,
        severity: "medium",
        entityType: "EmailExecution",
        entityId: email.id,
        payload: { emailId: email.id },
      },
    })

    return NextResponse.json({
      ok: true,
      email,
    })
  } catch (error) {
    console.error("Email approval failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to approve email" },
      { status: 500 }
    )
  }
}