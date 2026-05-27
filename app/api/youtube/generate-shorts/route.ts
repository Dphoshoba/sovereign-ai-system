import fs from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const resolvedFfmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe"
)

ffmpeg.setFfmpegPath(resolvedFfmpegPath)

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

    if (!post.renderedVideoUrl) {
      return NextResponse.json(
        { ok: false, error: "Render the full video first." },
        { status: 400 }
      )
    }

    const inputPath = path.join(
      process.cwd(),
      "public",
      post.renderedVideoUrl.replace(/^\//, "")
    )

    if (!fs.existsSync(inputPath)) {
      return NextResponse.json(
        { ok: false, error: "Rendered video file not found." },
        { status: 400 }
      )
    }

    const shortsDir = path.join(process.cwd(), "public", "shorts")
    if (!fs.existsSync(shortsDir)) {
      fs.mkdirSync(shortsDir, { recursive: true })
    }

    const outputFile = `${post.id}-short.mp4`
    const outputPath = path.join(shortsDir, outputFile)

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-ss",
          "0",
          "-t",
          "45",
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
        ])
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
    })

    const shortsVideoUrl = `/shorts/${outputFile}`

    const updated = await prisma.youTubePost.update({
      where: { id: post.id },
      data: {
        shortsVideoUrl,
        shortsStatus: "rendered",
      },
    })

    return NextResponse.json({
      ok: true,
      shortsVideoUrl,
      post: updated,
    })
  } catch (error) {
    console.error("Shorts generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Shorts video",
      },
      { status: 500 }
    )
  }
}