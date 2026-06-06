import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      category,
      excerpt,
    } = await req.json()

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Missing title" },
        { status: 400 }
      )
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        category: category || "ai-tools",
        excerpt:
          excerpt ||
          "A planned article generated from the Echoes & Visions content planning system.",
        content: "",
        status: "draft",
      },
    })

    return NextResponse.json({
      ok: true,
      article,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create draft",
      },
      { status: 500 }
    )
  }
}