import { NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.emailId) {
      return NextResponse.json(
        { ok: false, error: "emailId is required" },
        { status: 400 }
      )
    }

    const email = await prisma.emailExecution.findUnique({
      where: { id: body.emailId },
    })

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email execution not found" },
        { status: 404 }
      )
    }

    if (!email.approved) {
      return NextResponse.json(
        { ok: false, error: "Email must be approved before sending" },
        { status: 403 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "RESEND_API_KEY is missing" },
        { status: 500 }
      )
    }

    const from = process.env.EMAIL_FROM || "Echoes & Visions <onboarding@resend.dev>"

    await prisma.emailExecution.update({
      where: { id: email.id },
      data: { status: "sending" },
    })

    const result = await resend.emails.send({
      from,
      to: email.to,
      subject: email.subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7">${email.body.replace(
        /\n/g,
        "<br />"
      )}</div>`,
    })

    if (result.error) {
      const failed = await prisma.emailExecution.update({
        where: { id: email.id },
        data: {
          status: "failed",
          error: result.error.message,
        },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "email-send-failed",
          source: "email-execution",
          title: `Email failed: ${email.subject}`,
          message: result.error.message,
          severity: "high",
          entityType: "EmailExecution",
          entityId: email.id,
          payload: { emailId: email.id },
        },
      })

      return NextResponse.json(
        { ok: false, email: failed, error: result.error.message },
        { status: 500 }
      )
    }

    const sent = await prisma.emailExecution.update({
      where: { id: email.id },
      data: {
        status: "sent",
        providerId: result.data?.id || null,
        sentAt: new Date(),
      },
    })

    await prisma.externalOperationLog.create({
      data: {
        integration: "resend",
        operationType: "send-email",
        title: email.subject,
        status: "completed",
        payload: { to: email.to, subject: email.subject },
        result: result.data || {},
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "email-sent",
        source: "email-execution",
        title: `Email sent: ${email.subject}`,
        message: `Sent to ${email.to}`,
        severity: "info",
        entityType: "EmailExecution",
        entityId: email.id,
        payload: { emailId: email.id, providerId: result.data?.id },
      },
    })

    return NextResponse.json({
      ok: true,
      email: sent,
      provider: result.data,
    })
  } catch (error) {
    console.error("Email send failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Email send failed",
      },
      { status: 500 }
    )
  }
}