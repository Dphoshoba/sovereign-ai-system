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

function chunkCaption(text: string, size = 4) {
  const words = text.split(" ")
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "))
  }

  return chunks
}

function formatChunkDisplay(chunk: string) {
  const words = chunk
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase())

  if (words.length <= 2) {
    return words.join(" ")
  }

  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].join("\n")
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

    const sentences = lines.map((text, index) => {
      const start = index * 4
      const duration = 3.5

      return {
        start,
        end: start + duration,
        duration,
        text,
      }
    })

    let cueIndex = 1
    const srtEntries: string[] = []

    for (const sentence of sentences) {
      const chunks = chunkCaption(sentence.text, 3)
      const chunkDuration = sentence.duration / chunks.length

      chunks.forEach((chunk, index) => {
        const start = sentence.start + index * chunkDuration
        const end = start + chunkDuration

        srtEntries.push(
          `${cueIndex++}
${formatTime(start)} --> ${formatTime(end)}
${formatChunkDisplay(chunk)}
`
        )
      })
    }

    const srt = srtEntries.join("\n")

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
