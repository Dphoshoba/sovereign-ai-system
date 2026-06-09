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

type RenderInput = {
  audioPath: string
  outputName?: string
}

export async function renderVideoLocal(input: RenderInput) {
  const {
    audioPath,
    outputName = `render-${Date.now()}.mp4`,
  } = input

  const outputDir = path.join(
    process.cwd(),
    "public",
    "renders"
  )

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true,
    })
  }

  const outputPath = path.join(outputDir, outputName)
  const backgroundPath = path.join(
    process.cwd(),
    "public",
    "default-background.png"
  )

  return new Promise<{ outputPath: string; publicUrl: string }>((resolve, reject) => {
    ffmpeg()
      .input(backgroundPath)
      .inputOptions(["-loop", "1"])
      .input(audioPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-shortest",
        "-pix_fmt",
        "yuv420p",
        "-vf",
        "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
      ])
      .save(outputPath)
      .on("end", () => {
        resolve({
          outputPath,
          publicUrl: `/renders/${outputName}`,
        })
      })
      .on("error", reject)
  })
}
