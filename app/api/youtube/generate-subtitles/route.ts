import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function splitIntoLines(text: string) {
  return text
    .replace(/\[.*?\]/g, "")
    .split(/[.!?]\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40)
}

function formatTime(seconds: number) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0")
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")
  const s = String(Math.floor(seconds % 60)).padStart(2, "0")
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, "0")

  return `${h}:${m}:${s},${ms}`
}

export async function POST(req: Request) {
  try {
    const { youtubePostId } = await req.json()

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

    const sourceText = post.fullScript || post.description || post.title
    const lines = splitIntoLines(sourceText)

    const srt = lines
      .map((line, index) => {
        const start = index * 4
        const end = start + 3.5

        return `${index + 1}
${formatTime(start)} --> ${formatTime(end)}
${line}
`
      })
      .join("\n")

    const dir = path.join(process.cwd(), "public", "subtitles")

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const fileName = `${post.id}.srt`
    const filePath = path.join(dir, fileName)

    fs.writeFileSync(filePath, srt, "utf8")

    const subtitleUrl = `/subtitles/${fileName}`

    const updated = await prisma.youTubePost.update({
      where: { id: post.id },
      data: { subtitleUrl },
    })

    return NextResponse.json({
      ok: true,
      subtitleUrl,
      post: updated,
    })
  } catch (error) {
    console.error("Subtitle generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Subtitle generation failed",
      },
      { status: 500 }
    )
  }
}