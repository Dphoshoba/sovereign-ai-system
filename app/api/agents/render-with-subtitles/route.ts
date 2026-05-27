import { NextRequest, NextResponse } from "next/server"
import ffmpeg from "fluent-ffmpeg"
import path from "path"
import fs from "fs"

const resolvedFfmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe"
)

ffmpeg.setFfmpegPath(resolvedFfmpegPath)

function safeSubtitlePath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.videoFile) {
      return NextResponse.json(
        { ok: false, error: "videoFile required" },
        { status: 400 }
      )
    }

    if (!body.subtitleFile) {
      return NextResponse.json(
        { ok: false, error: "subtitleFile required" },
        { status: 400 }
      )
    }

    const videoPath = path.join(process.cwd(), "public", body.videoFile)
    const subtitlePath = path.join(process.cwd(), "public", body.subtitleFile)

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { ok: false, error: "Video file not found" },
        { status: 404 }
      )
    }

    if (!fs.existsSync(subtitlePath)) {
      return NextResponse.json(
        { ok: false, error: "Subtitle file not found" },
        { status: 404 }
      )
    }

    const outputDir = path.join(process.cwd(), "public", "captioned-renders")

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const outputName = `captioned-${Date.now()}.mp4`
    const outputPath = path.join(outputDir, outputName)

    const subtitleFilter = `subtitles='${safeSubtitlePath(
      subtitlePath
    )}':force_style='FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=80'`

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .videoFilters(subtitleFilter)
        .outputOptions([
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "copy",
          "-pix_fmt",
          "yuv420p",
        ])
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", reject)
    })

    return NextResponse.json({
      ok: true,
      result: {
        outputPath,
        publicUrl: `/captioned-renders/${outputName}`,
      },
    })
  } catch (error) {
    console.error("Burned subtitle render failed:", error)

    return NextResponse.json(
      { ok: false, error: "Burned subtitle render failed" },
      { status: 500 }
    )
  }
}