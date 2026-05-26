import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"

function toText(value: unknown) {
  if (value === null || value === undefined) return null
  return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}

export async function POST(req: Request) {  try {
    const { youtubePostId } = await req.json()

    if (!youtubePostId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing youtubePostId",
        },
        { status: 400 }
      )
    }

    const post = await prisma.youTubePost.findUnique({
      where: {
        id: youtubePostId,
      },
    })

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          error: "YouTube post not found",
        },
        { status: 404 }
      )
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are a world-class YouTube strategist and scriptwriter for Echoes & Visions. Return only valid JSON.",
        },
        {
          role: "user",
          content: `
Create a highly engaging YouTube script package.

Title:
${post.title}

Description:
${post.description}

Return JSON:
{
  "fullScript": "...",
  "shortsHooks": "...",
  "retentionHooks": "...",
  "chapterTimestamps": "...",
  "cta": "..."
}
          `,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const parsed = JSON.parse(cleaned)

    const updated = await prisma.youTubePost.update({
      where: {
        id: post.id,
      },
      data: {
        fullScript: toText(parsed.fullScript),
        shortsHooks: toText(parsed.shortsHooks),
        retentionHooks: toText(parsed.retentionHooks),
        chapterTimestamps: toText(parsed.chapterTimestamps),
        cta: toText(parsed.cta),
      },
    })

    return NextResponse.json({
      ok: true,
      post: updated,
    })
  } catch (error) {
    console.error("Script generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate script",
      },
      { status: 500 }
    )
  }
}