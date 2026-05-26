import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import ffmpeg from "fluent-ffmpeg"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const resolvedFfmpegPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe"
)

ffmpeg.setFfmpegPath(resolvedFfmpegPath)

type SceneTimelineItem = {
  start: number
  end: number
  duration?: number
  scene: string
  broll?: string
  text?: string
  emotion?: string
  transition?: string
}

function chooseMusic(post: {
  title?: string | null
  description?: string | null
  fullScript?: string | null
}) {
  const text = `
    ${post.title || ""}
    ${post.description || ""}
    ${post.fullScript || ""}
  `.toLowerCase()

  if (
    text.includes("heart") ||
    text.includes("prayer") ||
    text.includes("spiritual") ||
    text.includes("ministry") ||
    text.includes("community")
  ) {
    return "soft-piano.mp3"
  }

  if (
    text.includes("powerful") ||
    text.includes("breakthrough") ||
    text.includes("transform") ||
    text.includes("growth")
  ) {
    return "inspirational.mp3"
  }

  if (
    text.includes("ai") ||
    text.includes("automation") ||
    text.includes("future") ||
    text.includes("technology")
  ) {
    return "cinematic-ambient.mp3"
  }

  return "calm-documentary.mp3"
}

function getTransitionFilter(transition?: string) {
  switch (transition) {
    case "fast-cut":
      return "fade=t=in:st=0:d=0.15"

    case "crossfade":
      return "fade=t=in:st=0:d=0.6"

    case "slow-fade":
      return "fade=t=in:st=0:d=1.2"

    default:
      return "fade=t=in:st=0:d=0.4"
  }
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

    if (!post.voiceoverUrl) {
      return NextResponse.json(
        { ok: false, error: "Generate voiceover first." },
        { status: 400 }
      )
    }

    const scenesDir = path.join(
      process.cwd(),
      "public",
      "backgrounds",
      "scenes"
    )

    const sceneFiles = fs.existsSync(scenesDir)
      ? fs
          .readdirSync(scenesDir)
          .filter((file) => file.endsWith(".mp4"))
          .map((file) => path.join(scenesDir, file))
      : []

    const fallbackBackgroundPath = path.join(
      process.cwd(),
      "public",
      "backgrounds",
      "default.mp4"
    )

    const videoInputs =
      sceneFiles.length > 0 ? sceneFiles : [fallbackBackgroundPath]

    const audioPath = path.join(
      process.cwd(),
      "public",
      post.voiceoverUrl.replace("/", "")
    )

    const outputDir = path.join(process.cwd(), "public", "rendered-videos")

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    if (!fs.existsSync(audioPath)) {
      return NextResponse.json(
        { ok: false, error: "Voiceover file not found." },
        { status: 400 }
      )
    }

    const outputFile = `${post.id}-rendered.mp4`
    const outputPath = path.join(outputDir, outputFile)

    const subtitlePath = post.subtitleUrl
      ? path.join(
          process.cwd(),
          "public",
          post.subtitleUrl.replace("/", "")
        )
      : null

    const hasSubtitles =
      subtitlePath && fs.existsSync(subtitlePath)

    const subtitleFilter = hasSubtitles
      ? `subtitles='${subtitlePath.replace(/\\/g, "\\\\").replace(/:/g, "\\:")}':force_style='FontSize=28,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=80'`
      : null

    const timeline = Array.isArray(post.sceneTimeline)
      ? (post.sceneTimeline as SceneTimelineItem[])
      : []

    const baseZoomPan =
      "zoompan=z='min(zoom+0.0005,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125"

    const primaryTransition =
      timeline.length > 0
        ? getTransitionFilter(timeline[0]?.transition)
        : ""

    const videoFilter = [
      "scale=1920:1080",
      baseZoomPan,
      primaryTransition,
      "format=yuv420p",
      ...(subtitleFilter ? [subtitleFilter] : []),
    ]
      .filter(Boolean)
      .join(",")

    const timelineSceneFiles =
      timeline.length > 0
        ? timeline.map((item) => {
            const source = item.broll || item.scene

            return path.join(
              process.cwd(),
              "public",
              source.replace("/", "")
            )
          })
        : []

    const sceneFilesToUse =
      timelineSceneFiles.length > 0
        ? timelineSceneFiles
        : videoInputs

    const validSceneFiles = sceneFilesToUse.filter((file) =>
      fs.existsSync(file)
    )

    if (validSceneFiles.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No valid scene files found.",
        },
        { status: 400 }
      )
    }

    const concatListPath = path.join(outputDir, `${post.id}-concat.txt`)

    fs.writeFileSync(
      concatListPath,
      validSceneFiles
        .map((file) => `file '${file.replace(/\\/g, "/")}'`)
        .join("\n")
    )

    const selectedMusic = chooseMusic(post)

    const musicPath = path.join(
      process.cwd(),
      "public",
      "music",
      selectedMusic
    )

    console.log("Selected music:", selectedMusic)

    const hasMusic = fs.existsSync(musicPath)

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f", "concat", "-safe", "0", "-stream_loop", "-1"])
        .input(audioPath)

      if (hasMusic) {
        command.input(musicPath)
      }

      command
        .outputOptions(
          hasMusic
            ? [
                "-map 0:v:0",
                "-filter_complex",
                `[1:a]volume=1.0[voice];[2:a]volume=0.18[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
                "-map",
                "[aout]",
                "-shortest",
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
              ]
            : [
                "-map 0:v:0",
                "-map 1:a:0",
                "-shortest",
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
              ]
        )
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
    })

    const renderedVideoUrl = `/rendered-videos/${outputFile}`

    const updated = await prisma.youTubePost.update({
      where: { id: post.id },
      data: {
        renderedVideoUrl,
        renderStatus: "rendered",
        selectedMusic,
      },
    })

    return NextResponse.json({
      ok: true,
      renderedVideoUrl,
      post: updated,
    })
  } catch (error) {
    console.error("Video render failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Render failed",
      },
      { status: 500 }
    )
  }
}