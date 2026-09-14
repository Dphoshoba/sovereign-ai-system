import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseOptionalSchedulingTimestamp } from "../../../lib/publishing/adelaide-time"

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      ok: true,
      count: articles.length,
      articles,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const status = body.status || "draft"
    const parsedSchedule = parseOptionalSchedulingTimestamp(body.scheduledFor)
    if (!parsedSchedule.ok) {
      return NextResponse.json(
        { ok: false, error: parsedSchedule.error },
        { status: 400 }
      )
    }

    const article = await prisma.article.create({
      data: {
        title: body.title,
        slug: body.slug,
        category: body.category,
        status,

        excerpt: body.excerpt || null,
        content: body.content || null,
        featuredImage: body.featuredImage || null,

        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        seoKeywords: body.seoKeywords || null,

        publishedAt: status === "published" ? new Date() : null,
        scheduledFor: parsedSchedule.date,
      },
    })

    return NextResponse.json({
      ok: true,
      article,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Failed to create article" },
      { status: 500 }
    )
  }
}