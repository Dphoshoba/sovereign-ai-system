import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { draftId } = await req.json()

    if (!draftId) {
      return NextResponse.json(
        { ok: false, error: "Missing draftId" },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY" },
        { status: 500 }
      )
    }

    const draft = await prisma.newsletterDraft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json(
        { ok: false, error: "Newsletter draft not found" },
        { status: 404 }
      )
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        status: "active",
      },
    })

    if (subscribers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No active subscribers found" },
        { status: 400 }
      )
    }

    const results = []

    for (const subscriber of subscribers) {
      const result = await resend.emails.send({
        from: "Echoes & Visions <newsletter@yourdomain.com>",
        to: subscriber.email,
        subject: draft.subject,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827; max-width: 680px; margin: 0 auto;">
            <p style="color:#6b7280;">${draft.previewText || ""}</p>
            ${draft.body}
            <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="font-size:13px;color:#6b7280;">
              You are receiving this because you subscribed to Echoes & Visions.
            </p>
          </div>
        `,
      })

      results.push({
        email: subscriber.email,
        result,
      })
    }

    await prisma.newsletterDraft.update({
      where: { id: draft.id },
      data: {
        status: "sent",
      },
    })

    return NextResponse.json({
      ok: true,
      sent: subscribers.length,
      results,
    })
  } catch (error) {
    console.error("Newsletter send failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send newsletter",
      },
      { status: 500 }
    )
  }
}