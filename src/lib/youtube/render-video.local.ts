import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
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

const resolvedFfprobePath = path.join(
  process.cwd(),
  "node_modules",
  "ffprobe-static",
  "bin",
  "win32",
  "x64",
  "ffprobe.exe"
)

ffmpeg.setFfprobePath(resolvedFfprobePath)

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

function getCameraMotion(emotion?: string) {
  switch (emotion) {
    case "high":
      return {
        zoom:
          "zoompan=z='min(max(zoom,pzoom)+0.0015,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30",
      }

    case "warm":
      return {
        zoom:
          "zoompan=z='min(max(zoom,pzoom)+0.0008,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30",
      }

    default:
      return {
        zoom:
          "zoompan=z='min(max(zoom,pzoom)+0.0004,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30",
      }
  }
}

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err)
      else resolve(Number(metadata.format.duration) || 0)
    })
  })
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

/** Local/self-hosted only — do not import from Vercel API routes. */
export async function renderVideoLocalPost(req: NextRequest) {
  try {
    const body = await req.json()
    const youtubePostId = body.youtubePostId

    if (!youtubePostId) {
      return NextResponse.json(
        { error: "youtubePostId required" },
        { status: 400 }
      )
    }

    const post = await prisma.youTubePost.findUnique({
      where: { id: youtubePostId },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    if (!post.voiceoverUrl) {
      return NextResponse.json(
        { error: "Voiceover not found" },
        { status: 400 }
      )
    }

    const outputDir = path.join(
      process.cwd(),
      "public",
      "rendered-videos"
    )

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const audioPath = path.join(
      process.cwd(),
      "public",
      post.voiceoverUrl.replace(/^\//, "")
    )

    if (!fs.existsSync(audioPath)) {
      return NextResponse.json(
        { error: "Voiceover not found" },
        { status: 400 }
      )
    }

    const voiceoverDuration = await getAudioDuration(audioPath)

    const timeline: SceneTimelineItem[] = Array.isArray(post.sceneTimeline)
      ? (post.sceneTimeline as SceneTimelineItem[])
      : []

    const timelineSceneFiles =
      timeline.length > 0
        ? timeline.map((item) => {
            const source = item.broll || item.scene

            return path.join(
              process.cwd(),
              "public",
              source.replace(/^\//, "")
            )
          })
        : []

    const validSceneFiles = timelineSceneFiles.filter((file) =>
      fs.existsSync(file)
    )

    const fallbackBackgroundPath = path.join(
      process.cwd(),
      "public",
      "backgrounds",
      "default.mp4"
    )

    const videoInputs =
      validSceneFiles.length > 0
        ? validSceneFiles
        : [fallbackBackgroundPath]

    const segmentDir = path.join(outputDir, `${post.id}-segments`)

    if (!fs.existsSync(segmentDir)) {
      fs.mkdirSync(segmentDir, { recursive: true })
    }

    const renderedSegments: string[] = []

    for (let i = 0; i < videoInputs.length; i++) {
      const sourceFile = videoInputs[i]
      const segmentPath = path.join(segmentDir, `segment-${i}.mp4`)

      await new Promise<void>((resolve, reject) => {
        ffmpeg(sourceFile)
          .inputOptions(["-stream_loop", "-1"])
          .outputOptions([
            "-t",
            String(Math.max(4, Math.ceil(timeline[i]?.duration || 6))),
            "-vf",
            "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-an",
          ])
          .save(segmentPath)
          .on("end", () => resolve())
          .on("error", (err: Error) => reject(err))
      })

      renderedSegments.push(segmentPath)
    }

    let currentVisualDuration = renderedSegments.reduce(
      (total, _, index) =>
        total + Math.max(4, Math.ceil(timeline[index]?.duration || 6)),
      0
    )

    while (currentVisualDuration < voiceoverDuration) {
      for (let i = 0; i < renderedSegments.length; i++) {
        if (currentVisualDuration >= voiceoverDuration) break

        renderedSegments.push(renderedSegments[i])
        currentVisualDuration += Math.max(
          4,
          Math.ceil(timeline[i]?.duration || 6)
        )
      }
    }

    const concatListPath = path.join(
      outputDir,
      `${post.id}-concat.txt`
    )

    fs.writeFileSync(
      concatListPath,
      renderedSegments
        .map((file) => `file '${file.replace(/\\/g, "/")}'`)
        .join("\n")
    )

    const primaryEmotion =
      timeline.length > 0
        ? timeline[0]?.emotion
        : "calm"

    const cameraMotion = getCameraMotion(primaryEmotion)

    const primaryTransition =
      timeline.length > 0
        ? getTransitionFilter(timeline[0]?.transition)
        : ""

    const subtitlePath = post.subtitleUrl
      ? path.join(process.cwd(), "public", post.subtitleUrl.replace("/", ""))
      : null

    const safeSubtitlePath = subtitlePath
      ? subtitlePath.replace(/\\/g, "/").replace(/:/g, "\\:")
      : ""

    const subtitleFilter =
      subtitlePath && fs.existsSync(subtitlePath)
        ? `subtitles='${safeSubtitlePath}':force_style='FontName=Arial,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=60'`
        : ""

    const videoFilter = subtitleFilter
      ? `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,${cameraMotion.zoom},${primaryTransition},format=yuv420p,${subtitleFilter}`
      : `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,${cameraMotion.zoom},${primaryTransition},format=yuv420p`

    const selectedMusic = chooseMusic(post)

    const musicPath = path.join(
      process.cwd(),
      "public",
      "music",
      selectedMusic
    )

    const outputFile = `${post.id}-rendered-${Date.now()}.mp4`

    const outputPath = path.join(outputDir, outputFile)

    const hasMusic = fs.existsSync(musicPath)

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg()
        .input(concatListPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .input(audioPath)

      if (hasMusic) {
        command.input(musicPath)
      }

      command
        .complexFilter([
          fs.existsSync(musicPath)
            ? "[1:a]volume=1.0[voice];[2:a]volume=0.12[music];[voice][music]amix=inputs=2:duration=first[aout]"
            : "[1:a]volume=1[aout]",
        ])
        .outputOptions([
          "-map",
          "0:v",
          "-map",
          "[aout]",
          "-vf",
          videoFilter,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-r",
          "30",
          "-t",
          String(voiceoverDuration),
        ])
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
    })

    const renderedVideoUrl = `/rendered-videos/${outputFile}`

    await prisma.youTubePost.update({
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
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Render failed",
      },
      { status: 500 }
    )
  }
}
