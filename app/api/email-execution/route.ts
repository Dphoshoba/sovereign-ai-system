import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const emails = await prisma.emailExecution.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      emails,
    })
  } catch (error) {
    console.error("Email execution fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch email executions" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const to = body.to?.trim()
    const subject = body.subject?.trim()
    const emailBody = body.body?.trim()

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { ok: false, error: "to, subject and body are required" },
        { status: 400 }
      )
    }

    const email = await prisma.emailExecution.create({
      data: {
        to,
        subject,
        body: emailBody,
        leadId: body.leadId || null,
        source: body.source || "manual",
        riskLevel: body.riskLevel || "medium",
        status: body.approved ? "queued" : "approval-required",
        approved: Boolean(body.approved),
        metadata: body.metadata || {},
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "email-draft-created",
        source: "email-execution",
        title: `Email prepared: ${subject}`,
        message: `Email prepared for ${to}`,
        severity: email.approved ? "medium" : "high",
        entityType: "EmailExecution",
        entityId: email.id,
        payload: { emailId: email.id, to, subject },
      },
    })

    return NextResponse.json({
      ok: true,
      email,
    })
  } catch (error) {
    console.error("Email execution create failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create email execution" },
      { status: 500 }
    )
  }
}