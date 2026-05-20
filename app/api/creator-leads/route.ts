import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
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
  try {
    const body = await request.json()

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const creatorType = body.creatorType?.trim()

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
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        lead: existingLead,
      })
    }

    const lead = await prisma.creatorLead.create({
      data: {
        name,
        email,
        creatorType,
        niche: creatorType || null,
        status: "new",
        readiness: "starter-pack",
        leadScore: 50,
      },
    })

    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error("Creator lead capture failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save creator lead",
      },
      { status: 500 }
    )
  }
}