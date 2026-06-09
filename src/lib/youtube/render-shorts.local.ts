import fs from "fs"
import path from "path"

import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

/** Local/self-hosted only — do not import from Vercel API routes. */
export async function renderShortsLocalPost(req: Request) {
  try {
    const { youtubePostId } =
      await req.json()

    if (!youtubePostId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing youtubePostId",
        },
        { status: 400 }
      )
    }

    const post =
      await prisma.youTubePost.findUnique({
        where: {
          id: youtubePostId,
        },
      })

    if (!post) {
      return NextResponse.json(
        {
          ok: false,
          error: "Post not found",
        },
        { status: 404 }
      )
    }

    /*
      TEMP:
      Reuse placeholder video
      Replace later with true
      vertical rendering pipeline
    */

    const sourceVideo = path.join(
      process.cwd(),
      "public",
      "test-video.mp4"
    )

    const shortsDir = path.join(
      process.cwd(),
      "public",
      "shorts"
    )

    if (!fs.existsSync(shortsDir)) {
      fs.mkdirSync(shortsDir, {
        recursive: true,
      })
    }

    const outputFile =
      `${post.id}-short.mp4`

    const outputPath = path.join(
      shortsDir,
      outputFile
    )

    fs.copyFileSync(
      sourceVideo,
      outputPath
    )

    const videoUrl =
      `/shorts/${outputFile}`

    const updated =
      await prisma.youTubePost.update({
        where: {
          id: post.id,
        },
        data: {
          shortsVideoUrl: videoUrl,
          shortsStatus: "rendered",
        },
      })

    return NextResponse.json({
      ok: true,
      videoUrl,
      post: updated,
    })
  } catch (error) {
    console.error(
      "Shorts render failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Render failed",
      },
      { status: 500 }
    )
  }
}