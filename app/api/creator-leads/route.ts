import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

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

function captureText(value: unknown, max: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function captureEmail(value: unknown) {
  const email = captureText(value, 200)?.toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export async function POST(request: Request) {
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
      return NextResponse.json({ ok: true, alreadyExists: true })
    }

    await prisma.creatorLead.create({
      data: {
        name,
        email,
        creatorType,
        niche: creatorType,
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