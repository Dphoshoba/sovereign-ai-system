import fs from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Local/self-hosted Shorts render — genuine vertical pipeline.
 * Replaces the prior placeholder that only copied test-video.mp4.
 * Do not import from Vercel API routes.
 */

const resolvedFfmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg",
)

ffmpeg.setFfmpegPath(resolvedFfmpegPath)

const SHORTS_VERTICAL_BASE =
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p"

function resolveInputVideoPath(renderedVideoUrl: string): string {
  return path.join(
    process.cwd(),
    "public",
    renderedVideoUrl.replace(/^\//, ""),
  )
}

export async function renderShortsLocalPost(req: Request) {
  try {
    const { youtubePostId, startSeconds, durationSeconds } = await req.json()

    if (!youtubePostId) {
      return NextResponse.json(
        { ok: false, error: "Missing youtubePostId" },
        { status: 400 },
      )
    }

    const post = await prisma.youTubePost.findUnique({
      where: { id: youtubePostId },
    })

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 },
      )
    }

    if (!post.renderedVideoUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Render the full video first. Shorts require a long-form source.",
        },
        { status: 400 },
      )
    }

    const inputVideoPath = resolveInputVideoPath(post.renderedVideoUrl)
    if (!fs.existsSync(inputVideoPath)) {
      return NextResponse.json(
        { ok: false, error: "Rendered video file not found." },
        { status: 400 },
      )
    }

    const shortsDir = path.join(process.cwd(), "public", "shorts")
    if (!fs.existsSync(shortsDir)) {
      fs.mkdirSync(shortsDir, { recursive: true })
    }

    const outputFile = `${post.id}-short.mp4`
    const outputPath = path.join(shortsDir, outputFile)
    const start = typeof startSeconds === "number" ? Math.max(0, startSeconds) : 0
    const duration =
      typeof durationSeconds === "number" ? Math.min(60, Math.max(5, durationSeconds)) : 45

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputVideoPath)
        .setStartTime(start)
        .setDuration(duration)
        .outputOptions([
          "-vf",
          SHORTS_VERTICAL_BASE,
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

    const videoUrl = `/shorts/${outputFile}`
    const updated = await prisma.youTubePost.update({
      where: { id: post.id },
      data: {
        shortsVideoUrl: videoUrl,
        shortsStatus: "rendered",
      },
    })

    return NextResponse.json({
      ok: true,
      videoUrl,
      pipeline: "vertical-ffmpeg",
      dimensions: "1080x1920",
      start,
      duration,
      post: updated,
    })
  } catch (error) {
    console.error("Shorts render failed:", error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Render failed",
      },
      { status: 500 },
    )
  }
}
