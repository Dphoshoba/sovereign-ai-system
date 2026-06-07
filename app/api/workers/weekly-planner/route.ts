import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

function createSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  return `${base}-${randomUUID().slice(0, 8)}`
}

export async function GET() {
  try {
    const articles = await prisma.article.findMany()

    const defaultCategories = [
      "ai-tools",
      "ai-automation",
      "motivation",
      "health",
      "bible-stories",
      "space",
      "history",
    ]

    const categoryCounts: Record<string, number> = {}

    for (const category of defaultCategories) {
      categoryCounts[category] = 0
    }

    for (const article of articles) {
      if (!article.category) continue

      categoryCounts[article.category] =
        (categoryCounts[article.category] || 0) + 1
    }

    const lowestCategory =
      Object.entries(categoryCounts).sort((a, b) => a[1] - b[1])[0]?.[0] ||
      "ai-tools"

    const title = `Weekly Content Plan: ${lowestCategory}`

    const draft = await prisma.article.create({
      data: {
        title,
        slug: createSlug(title),
        category: lowestCategory,
        excerpt: "Automatically created by the weekly planner.",
        content: "",
        status: "draft",
      },
    })

    return NextResponse.json({
      ok: true,
      draftCreated: true,
      categoryCounts,
      draft,
    })
  } catch (error) {
    console.error("Weekly planner failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Weekly planner failed",
      },
      { status: 500 }
    )
  }
}