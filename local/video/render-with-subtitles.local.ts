import ffmpeg from "fluent-ffmpeg"
import path from "path"
import fs from "fs"

const resolvedFfmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
)

ffmpeg.setFfmpegPath(resolvedFfmpegPath)

function safeSubtitlePath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:")
}

export type RenderWithSubtitlesInput = {
  videoFile: string
  subtitleFile: string
}

export type RenderWithSubtitlesResult = {
  outputPath: string
  publicUrl: string
}

export async function renderWithSubtitlesLocal(
  input: RenderWithSubtitlesInput
): Promise<RenderWithSubtitlesResult> {
  const videoPath = path.join(process.cwd(), "public", input.videoFile)
  const subtitlePath = path.join(process.cwd(), "public", input.subtitleFile)

  if (!fs.existsSync(videoPath)) {
    throw new Error("Video file not found")
  }

  if (!fs.existsSync(subtitlePath)) {
    throw new Error("Subtitle file not found")
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

  return {
    outputPath,
    publicUrl: `/captioned-renders/${outputName}`,
  }
}
