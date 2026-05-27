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

const SHORTS_VERTICAL_BASE =
  "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1,format=yuv420p"

const SUBTITLE_FORCE_STYLE =
  "FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=1,Alignment=2,MarginV=120"

const HIGHLIGHT_KEYWORDS =
  /\b(you|your|secret|mistake|warning|truth|future|powerful|never|always|why|how|most|nobody|discover|transform|breakthrough)\b/gi

const MOTION_CAPTION_PREFIX =
  "{\\fad(150,150)\\t(0,250,\\fscx95\\fscy95)\\t(250,450,\\fscx108\\fscy108)}"

type SrtCue = {
  start: number
  end: number
  text: string
}

function detectBestHook(script: string) {
  const hookPatterns = [
    /most people/i,
    /nobody tells you/i,
    /the future/i,
    /mistake/i,
    /secret/i,
    /you need to/i,
    /why .* matters/i,
    /this changes everything/i,
    /warning/i,
    /here's the truth/i,
  ]

  const sentences = script.split(/[.!?]/)

  let bestIndex = 0
  let bestScore = 0

  sentences.forEach((sentence, index) => {
    let score = 0

    hookPatterns.forEach((pattern) => {
      if (pattern.test(sentence)) {
        score += 10
      }
    })

    score += sentence.length > 80 ? 2 : 0
    score += sentence.includes("you") ? 2 : 0

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return {
    bestSentence: sentences[bestIndex] || "",
    bestIndex,
  }
}

function parseSrtTime(value: string) {
  const [time, ms = "0"] = value.trim().split(",")
  const [hours, minutes, seconds] = time.split(":").map(Number)

  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000
}

function parseSrt(content: string): SrtCue[] {
  return content
    .trim()
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) return null

      const timingLine = lines.find((line) => line.includes("-->"))
      if (!timingLine) return null

      const [startRaw, endRaw] = timingLine.split("-->").map((part) => part.trim())
      const text = lines.slice(lines.indexOf(timingLine) + 1).join(" ").trim()

      if (!text) return null

      return {
        start: parseSrtTime(startRaw),
        end: parseSrtTime(endRaw),
        text,
      }
    })
    .filter((cue): cue is SrtCue => cue !== null)
}

function splitIntoWordChunks(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  const targetSize = 4
  const minSize = 3
  const maxSize = 6

  for (let i = 0; i < words.length; ) {
    let size = Math.min(maxSize, Math.max(minSize, targetSize))

    const remaining = words.length - i
    if (remaining <= maxSize) {
      size = remaining
    } else if (remaining - size < minSize) {
      size = remaining - minSize
    }

    chunks.push(words.slice(i, i + size).join(" "))
    i += size
  }

  return chunks
}

function expandCuesToMotionChunks(cues: SrtCue[]) {
  const expanded: SrtCue[] = []

  for (const cue of cues) {
    const chunks = splitIntoWordChunks(cue.text)
    const duration = (cue.end - cue.start) / chunks.length

    chunks.forEach((chunk, index) => {
      expanded.push({
        start: cue.start + index * duration,
        end: cue.start + (index + 1) * duration,
        text: chunk,
      })
    })
  }

  return expanded
}

function formatAssTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const centiseconds = Math.floor((seconds % 1) * 100)

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`
}

function highlightKeywords(text: string) {
  return text.replace(
    HIGHLIGHT_KEYWORDS,
    "{\\1c&H0000FFFF&\\b1}$1{\\r}"
  )
}

function buildMotionAss(cues: SrtCue[], clipStart: number, clipDuration: number) {
  const clipCues = cues
    .filter((cue) => cue.end > clipStart && cue.start < clipStart + clipDuration)
    .map((cue) => ({
      start: Math.max(0, cue.start - clipStart),
      end: Math.min(clipDuration, cue.end - clipStart),
      text: cue.text,
    }))
    .filter((cue) => cue.end > cue.start)

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const dialogues = clipCues
    .map(
      (cue) =>
        `Dialogue: 0,${formatAssTime(cue.start)},${formatAssTime(cue.end)},Default,,0,0,0,,${MOTION_CAPTION_PREFIX}${highlightKeywords(cue.text)}`
    )
    .join("\n")

  return `${header}${dialogues}\n`
}

function safePathForFfmpeg(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:")
}

function buildShortsVideoFilter(subtitleFilePath: string | null) {
  const subtitleFilter =
    subtitleFilePath && fs.existsSync(subtitleFilePath)
      ? `subtitles='${safePathForFfmpeg(subtitleFilePath)}':force_style='${SUBTITLE_FORCE_STYLE}'`
      : ""

  return subtitleFilter
    ? `${SHORTS_VERTICAL_BASE},${subtitleFilter}`
    : SHORTS_VERTICAL_BASE
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

    if (!post.renderedVideoUrl) {
      return NextResponse.json(
        { ok: false, error: "Render the full video first." },
        { status: 400 }
      )
    }

    const script =
      post.fullScript ||
      post.scriptOutline ||
      post.description ||
      ""

    const hook = detectBestHook(script)

    const shortDuration = 45
    const hookMoments = [
      Math.max(0, hook.bestIndex * 6),
      Math.max(0, hook.bestIndex * 6 + 30),
      Math.max(0, hook.bestIndex * 6 + 60),
    ]

    const inputVideoPath = path.join(
      process.cwd(),
      "public",
      post.renderedVideoUrl.replace(/^\//, "")
    )

    if (!fs.existsSync(inputVideoPath)) {
      return NextResponse.json(
        { ok: false, error: "Rendered video file not found." },
        { status: 400 }
      )
    }

    const subtitlePath = post.subtitleUrl
      ? path.join(
          process.cwd(),
          "public",
          post.subtitleUrl.replace(/^\//, "")
        )
      : null

    const motionCues =
      subtitlePath && fs.existsSync(subtitlePath)
        ? expandCuesToMotionChunks(
            parseSrt(fs.readFileSync(subtitlePath, "utf8"))
          )
        : []

    const shortsDir = path.join(process.cwd(), "public", "shorts")
    if (!fs.existsSync(shortsDir)) {
      fs.mkdirSync(shortsDir, { recursive: true })
    }

    const shortsOutput: string[] = []

    for (let i = 0; i < hookMoments.length; i++) {
      const start = hookMoments[i]
      const shortFile = `${post.id}-short-${i + 1}.mp4`
      const shortOutputPath = path.join(shortsDir, shortFile)

      let motionAssPath: string | null = null

      if (motionCues.length > 0) {
        motionAssPath = path.join(shortsDir, `${post.id}-short-${i + 1}.ass`)
        fs.writeFileSync(
          motionAssPath,
          buildMotionAss(motionCues, start, shortDuration),
          "utf8"
        )
      }

      const videoFilter = buildShortsVideoFilter(motionAssPath)

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputVideoPath)
          .setStartTime(start)
          .setDuration(shortDuration)
          .outputOptions([
            "-vf",
            videoFilter,
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
          ])
          .save(shortOutputPath)
          .on("end", () => resolve())
          .on("error", (err: Error) => reject(err))
      })

      shortsOutput.push(`/shorts/${shortFile}`)
    }

    return NextResponse.json({
      ok: true,
      shortsVideos: shortsOutput,
      hook: {
        bestIndex: hook.bestIndex,
        bestSentence: hook.bestSentence,
      },
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
