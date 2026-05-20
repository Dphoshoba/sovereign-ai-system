import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [items, subscribers] = await Promise.all([
    prisma.contentOperatingItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  return NextResponse.json({
    ok: true,
    items,
    subscribers,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.title || !body.contentType) {
      return NextResponse.json(
        { ok: false, error: "title and contentType are required" },
        { status: 400 }
      )
    }

    const item = await prisma.contentOperatingItem.create({
      data: {
        title: body.title,
        contentType: body.contentType,
        channel: body.channel || "youtube",
        pillar: body.pillar || null,
        status: body.status || "idea",
        priority: body.priority || "medium",
        hook: body.hook || null,
        script: body.script || null,
        description: body.description || null,
        cta: body.cta || "Join the Sovereign Intelligence Newsletter.",
        tags: body.tags || [],
        publishAt: body.publishAt ? new Date(body.publishAt) : null,
        metadata: body.metadata || {},
      },
    })

    return NextResponse.json({
      ok: true,
      item,
    })
  } catch (error) {
    console.error("Content OS create failed:", error)

    return NextResponse.json(
      { ok: false, error: "Content OS create failed" },
      { status: 500 }
    )
  }
}