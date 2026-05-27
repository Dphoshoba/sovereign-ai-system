import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"

import { subtitleAgent } from "../../../../lib/agents/subtitle-agent"
import { subtitlesToSRT } from "../../../../lib/agents/srt-formatter"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let script = body.script || ""

    if (!script && body.youtubePostId) {
      const post = await prisma.youTubePost.findUnique({
        where: {
          id: body.youtubePostId,
        },
      })

      script = post?.fullScript || ""
    }

    if (!script) {
      return NextResponse.json(
        {
          ok: false,
          error: "Script required",
        },
        {
          status: 400,
        }
      )
    }

    const subtitles = subtitleAgent({
      script,
    })

    const srt = subtitlesToSRT(subtitles)

    const outputDir = path.join(
      process.cwd(),
      "public",
      "subtitles"
    )

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {
        recursive: true,
      })
    }

    const filename = `subtitles-${Date.now()}.srt`

    const outputPath = path.join(outputDir, filename)

    fs.writeFileSync(outputPath, srt)

    return NextResponse.json({
      ok: true,
      subtitles,
      srt,
      publicUrl: `/subtitles/${filename}`,
    })
  } catch (error) {
    console.error("Subtitle generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Subtitle generation failed",
      },
      {
        status: 500,
      }
    )
  }
}