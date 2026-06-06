import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { newsletterId } = await req.json()

    if (!newsletterId) {
      return NextResponse.json(
        { ok: false, error: "Missing newsletterId" },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY" },
        { status: 500 }
      )
    }

    const newsletter = await prisma.newsletter.findUnique({
      where: {
        id: newsletterId,
      },
    })

    if (!newsletter) {
      return NextResponse.json(
        { ok: false, error: "Newsletter not found" },
        { status: 404 }
      )
    }

    if (newsletter.status === "sent") {
      return NextResponse.json(
        { ok: false, error: "This newsletter has already been sent." },
        { status: 400 }
      )
    }

    if (newsletter.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Newsletter must be approved first" },
        { status: 403 }
      )
    }

    const subscribers = await prisma.subscriber.findMany({
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

    const from =
      process.env.NEWSLETTER_FROM ||
      "Echoes & Visions <newsletter@yourdomain.com>"

    const sent = await Promise.all(
      subscribers.map((subscriber) =>
        resend.emails.send({
          from,
          to: subscriber.email,
          subject: newsletter.subject,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827; max-width: 680px; margin: 0 auto;">
              <p style="color:#6b7280;">${newsletter.previewText || ""}</p>
              ${newsletter.content}
              <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="font-size:13px;color:#6b7280;">
                You are receiving this because you subscribed to Echoes & Visions.
              </p>
            </div>
          `,
        })
      )
    )

    const updated = await prisma.newsletter.update({
      where: {
        id: newsletter.id,
      },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      ok: true,
      sent: subscribers.length,
      results: sent,
      newsletter: updated,
    })
  } catch (error) {
    console.error("Newsletter send failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Send failed",
      },
      { status: 500 }
    )
  }
}
