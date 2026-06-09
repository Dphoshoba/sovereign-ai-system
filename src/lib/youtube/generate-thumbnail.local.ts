import fs from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import sharp from "sharp"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const THUMB_WIDTH = 1280
const THUMB_HEIGHT = 720

const resolvedFfmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe"
)

ffmpeg.setFfmpegPath(resolvedFfmpegPath)

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "string") return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeHookPhrases(value: unknown): string[] {
  if (!value) return []

  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : []
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item]
        if (item && typeof item === "object" && "text" in item) {
          return [String((item as { text: string }).text)]
        }
        return []
      })
      .map((phrase) => phrase.trim())
      .filter(Boolean)
  }

  return []
}

function getStoredHookPhrases(value?: string | null) {
  if (!value?.trim()) return []

  const parsed = safeJsonParse<unknown | null>(value, null)
  if (parsed !== null) {
    return normalizeHookPhrases(parsed)
  }

  return normalizeHookPhrases(value)
}

function getHookPhrasePool(
  script: string,
  post: {
    shortsHooks?: string | null
    viralAngles?: string | null
    shortsIdeas?: string | null
    retentionHooks?: string | null
  }
) {
  const fromScript = script
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const fromStored = [
    ...getStoredHookPhrases(post.shortsHooks),
    ...getStoredHookPhrases(post.viralAngles),
    ...getStoredHookPhrases(post.shortsIdeas),
    ...getStoredHookPhrases(post.retentionHooks),
  ]

  return [...new Set([...fromScript, ...fromStored].filter(Boolean))]
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

  const sentences = script
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  let bestIndex = 0
  let bestScore = 0
  let bestSentence = sentences[0] || ""

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
      bestSentence = sentence
    }
  })

  return {
    bestSentence,
    bestIndex,
    bestScore,
  }
}

function rankHookSentences(phrases: string[]) {
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

  return phrases
    .map((sentence, index) => {
      let score = 0

      hookPatterns.forEach((pattern) => {
        if (pattern.test(sentence)) {
          score += 10
        }
      })

      score += sentence.length > 80 ? 2 : 0
      score += sentence.includes("you") ? 2 : 0

      return { sentence, index, score }
    })
    .sort((a, b) => b.score - a.score)
}

function formatThumbnailHook(sentence: string) {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)

  if (words.length === 0) {
    return { line1: "WATCH THIS", line2: "NOW" }
  }

  if (words.length <= 2) {
    return {
      line1: words.join(" ").toUpperCase(),
      line2: "",
    }
  }

  const mid = Math.ceil(words.length / 2)

  return {
    line1: words.slice(0, mid).join(" ").toUpperCase(),
    line2: words.slice(mid).join(" ").toUpperCase(),
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type ThumbnailStyle = {
  name: string
  overlay: string
  textSize: number
}

function buildThumbnailOverlaySvg(
  line1: string,
  line2: string,
  style: ThumbnailStyle
) {
  const strokeWidth = Math.max(4, Math.round(style.textSize / 11))
  const line1Y = THUMB_HEIGHT - style.textSize * 2 - 80
  const line2Y = line1Y + style.textSize + 24

  const secondLine = line2
    ? `<text
        x="72"
        y="${line2Y}"
        font-family="Arial Black, Arial, sans-serif"
        font-size="${style.textSize}"
        font-weight="900"
        fill="#FFFFFF"
        stroke="#000000"
        stroke-width="${strokeWidth}"
        paint-order="stroke"
      >${escapeXml(line2)}</text>`
    : ""

  const svg = `<svg width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${style.overlay}"/>
  <text
    x="72"
    y="${line1Y}"
    font-family="Arial Black, Arial, sans-serif"
    font-size="${style.textSize}"
    font-weight="900"
    fill="#FFFFFF"
    stroke="#000000"
    stroke-width="${strokeWidth}"
    paint-order="stroke"
  >${escapeXml(line1)}</text>
  ${secondLine}
</svg>`

  return Buffer.from(svg)
}

/** Local/self-hosted only — do not import from Vercel API routes. */
export async function generateThumbnailLocalPost(req: Request) {
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

    if (!post.renderedVideoUrl) {
      return NextResponse.json(
        { ok: false, error: "Render the full video first." },
        { status: 400 }
      )
    }

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

    const script =
      post.fullScript ||
      post.scriptOutline ||
      post.description ||
      post.title ||
      ""

    const hookPhrases = getHookPhrasePool(script, post)
    const hook = detectBestHook(hookPhrases.join(". "))
    const rankedHooks = rankHookSentences(hookPhrases)

    const frameTimes = [5, 15, 30, 45, 60]

    const framesDir = path.join(process.cwd(), "public", "thumbnail-frames")

    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true })
    }

    const videoPath = inputVideoPath
    const extractedFrames: string[] = []

    for (const time of frameTimes) {
      const framePath = path.join(
        framesDir,
        `${post.id}-${time}.png`
      )

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(time)
          .frames(1)
          .output(framePath)
          .outputOptions(["-y", "-vf", "scale=1280:720"])
          .on("end", () => resolve())
          .on("error", reject)
          .run()
      })

      if (fs.existsSync(framePath)) {
        extractedFrames.push(framePath)
      }
    }

    if (extractedFrames.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Failed to extract thumbnail frames." },
        { status: 500 }
      )
    }

    const selectedFrames = extractedFrames.slice(0, 5)

    const thumbnailStyles: ThumbnailStyle[] = [
      {
        name: "cinematic",
        overlay: "rgba(0,0,0,0.45)",
        textSize: 72,
      },
      {
        name: "bold",
        overlay: "rgba(0,0,0,0.65)",
        textSize: 88,
      },
      {
        name: "minimal",
        overlay: "rgba(0,0,0,0.30)",
        textSize: 64,
      },
    ]

    const thumbnailsDir = path.join(
      process.cwd(),
      "public",
      "youtube-thumbnails"
    )

    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true })
    }

    const generatedThumbnails: string[] = []
    const variantMeta: Array<{
      style: string
      frame: string
      hook: { line1: string; line2: string }
    }> = []

    for (let i = 0; i < thumbnailStyles.length; i++) {
      const style = thumbnailStyles[i]
      const selectedFrame =
        selectedFrames[i % selectedFrames.length] || selectedFrames[0]

      const hookSentence =
        rankedHooks[i]?.sentence ||
        rankedHooks[0]?.sentence ||
        hook.bestSentence ||
        post.title

      const thumbnailText = formatThumbnailHook(hookSentence)

      const outputFile = `${post.id}-${style.name}-${Date.now()}.jpg`
      const outputPath = path.join(thumbnailsDir, outputFile)

      const overlaySvg = buildThumbnailOverlaySvg(
        thumbnailText.line1,
        thumbnailText.line2,
        style
      )

      console.log("Selected frame:", selectedFrame)
      console.log("Frame exists:", fs.existsSync(selectedFrame))

      await sharp(selectedFrame)
        .resize(THUMB_WIDTH, THUMB_HEIGHT, {
          fit: "cover",
          position: "centre",
        })
        .composite([{ input: overlaySvg, top: 0, left: 0 }])
        .jpeg({ quality: 90 })
        .toFile(outputPath)

      const thumbnailUrl = `/youtube-thumbnails/${outputFile}`
      generatedThumbnails.push(thumbnailUrl)
      variantMeta.push({
        style: style.name,
        frame: selectedFrame,
        hook: thumbnailText,
      })
    }

    const primaryThumbnail = generatedThumbnails[0]

    const updated = await prisma.youTubePost.update({
      where: { id: post.id },
      data: {
        thumbnailImage: primaryThumbnail,
        thumbnailPrompt: variantMeta
          .map(
            (variant) =>
              `${variant.style}: ${variant.hook.line1}${
                variant.hook.line2 ? ` / ${variant.hook.line2}` : ""
              }`
          )
          .join("\n"),
      },
    })

    return NextResponse.json({
      ok: true,
      thumbnails: generatedThumbnails,
      imageUrl: primaryThumbnail,
      variants: variantMeta,
      hook: {
        bestIndex: hook.bestIndex,
        bestSentence: hook.bestSentence,
        frameCandidates: frameTimes,
      },
      post: updated,
    })
  } catch (error) {
    console.error("Thumbnail generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate thumbnail",
      },
      { status: 500 }
    )
  }
}
