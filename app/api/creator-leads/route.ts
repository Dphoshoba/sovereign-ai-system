import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"
import {
  captureEmail,
  captureText,
  payloadWithinLimit,
  publicCaptureAllowed,
} from "../../../lib/security/public-capture"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const leads = await prisma.creatorLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ ok: true, leads })
  } catch (error) {
    console.error("Creator leads fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch creator leads" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!payloadWithinLimit(request) || !(await publicCaptureAllowed("creator-leads", request))) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const name = captureText(body?.name, 120)
    const email = captureEmail(body?.email)
    const creatorType = captureText(body?.creatorType, 120)

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      )
    }

    const existingLead = await prisma.creatorLead.findUnique({
      where: { email },
    })

    if (existingLead) {
      return NextResponse.json({ ok: true })
    }

    await prisma.creatorLead.create({
      data: {
        name,
        email,
        creatorType,
        niche: creatorType,
        notes: captureText(body?.notes, 1000),
        status: "new",
        readiness: "starter-pack",
        leadScore: 50,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Creator lead capture failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save creator lead" },
      { status: 500 }
    )
  }
}