import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  captureEmail,
  captureText,
  payloadWithinLimit,
  publicCaptureAllowed,
} from "../../../../lib/security/public-capture"

export async function POST(req: Request) {
  if (!payloadWithinLimit(req) || !(await publicCaptureAllowed("lead-magnet-subscribe", req))) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await req.json()
    const email = captureEmail(body?.email)
    const leadMagnetId = captureText(body?.leadMagnetId, 80)

    if (!email || !leadMagnetId) {
      return NextResponse.json(
        { ok: false, error: "A valid email and lead magnet are required" },
        { status: 400 }
      )
    }

    const leadMagnet = await prisma.leadMagnet.findUnique({
      where: { id: leadMagnetId },
    })

    if (!leadMagnet) {
      return NextResponse.json(
        { ok: false, error: "Lead magnet not found" },
        { status: 404 }
      )
    }

    await prisma.subscriber.upsert({
      where: { email },
      update: {
        status: "active",
        source: captureText(body?.source, 80) || "lead-magnet",
      },
      create: {
        email,
        status: "active",
        source: captureText(body?.source, 80) || "lead-magnet",
      },
    })

    await prisma.leadMagnet.update({
      where: { id: leadMagnetId },
      data: {
        downloads: { increment: 1 },
        subscribers: { increment: 1 },
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Lead magnet subscription failed" },
      { status: 500 }
    )
  }
}
