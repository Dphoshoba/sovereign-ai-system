import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function scoreTitle(title: string) {
  let score = 50

  const powerWords = [
    "secret",
    "future",
    "mistake",
    "truth",
    "warning",
    "automation",
    "AI",
    "powerful",
    "essential",
    "burnout",
    "save",
  ]

  const curiosityPatterns = ["how", "why", "most", "the", "this"]

  powerWords.forEach((word) => {
    if (title.toLowerCase().includes(word.toLowerCase())) {
      score += 5
    }
  })

  curiosityPatterns.forEach((word) => {
    if (title.toLowerCase().startsWith(word)) {
      score += 4
    }
  })

  if (title.length >= 40 && title.length <= 70) {
    score += 10
  }

  return Math.min(score, 100)
}

function clipTopic(text: string, max = 42) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3).trim()}...`
}

function buildTitleVariants(post: {
  title: string
  description?: string | null
  fullScript?: string | null
}) {
  const topic = clipTopic(post.title)
  const context = clipTopic(
    post.description || post.fullScript?.slice(0, 120) || post.title
  )

  const lower = `${post.title} ${post.description || ""} ${post.fullScript || ""}`.toLowerCase()
  const isMinistry =
    lower.includes("ministry") ||
    lower.includes("church") ||
    lower.includes("pastor")

  const variants = isMinistry
    ? [
        `Most Ministries Are Using AI Wrong`,
        `How Small Ministries Can Save Hours with AI`,
        `The AI Automation System Every Church Needs`,
        `Why Small Ministries Burn Out — And How AI Fixes It`,
        `This AI Strategy Changes Ministry Work Forever`,
      ]
    : [
        `Most People Are Getting ${topic} Wrong`,
        `How ${topic} Can Save You Hours with AI`,
        `The AI Automation System Everyone Needs for ${topic}`,
        `Why ${context} Burns People Out — And How AI Fixes It`,
        `This AI Strategy Changes ${topic} Forever`,
      ]

  variants.push(
    `Most People Are Getting ${topic} Wrong`,
    `How ${topic} Can Save You Hours Every Week`,
    `The ${topic} System Everyone Needs Right Now`,
    `Why ${context} Matters — And How To Fix It`,
    `This ${topic} Strategy Changes Everything`,
    post.title.trim()
  )

  return [...new Set(variants.map((title) => title.trim()).filter(Boolean))]
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const body = safeJsonParse(rawBody, {} as { youtubePostId?: string })
    const youtubePostId = body.youtubePostId

    if (!youtubePostId) {
      return NextResponse.json(
        { ok: false, error: "Missing youtubePostId" },
        { status: 400 }
      )
    }

    const post = await prisma.youTubePost.findUnique({
      where: { id: youtubePostId },
    })

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "YouTube post not found" },
        { status: 404 }
      )
    }

    const titleVariants = buildTitleVariants(post)

    const rankedTitles = titleVariants
      .map((title) => ({
        title,
        score: scoreTitle(title),
      }))
      .sort((a, b) => b.score - a.score)

    const bestTitle = rankedTitles[0]

    if (bestTitle) {
      await prisma.youTubePost.update({
        where: { id: post.id },
        data: { title: bestTitle.title },
      })
    }

    return NextResponse.json({
      ok: true,
      bestTitle,
      allTitles: rankedTitles,
    })
  } catch (error) {
    console.error("Title generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to generate titles",
      },
      { status: 500 }
    )
  }
}
