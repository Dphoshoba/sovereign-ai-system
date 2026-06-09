import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  getYouTubeClient,
  isYouTubeOAuthConfigured,
} from "@/lib/youtube"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    if (!isYouTubeOAuthConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "YouTube OAuth credentials are not configured",
        },
        { status: 500 }
      )
    }

    const { youtubePostId } = await req.json()

    if (!youtubePostId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing youtubePostId",
        },
        { status: 400 }
      )
    }

    const post = await prisma.youTubePost.findUnique({
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

    const videoPath = post.renderedVideoUrl
      ? path.join(
          process.cwd(),
          "public",
          post.renderedVideoUrl.replace("/", "")
        )
      : path.join(process.cwd(), "public", "test-video.mp4")

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Video file not found. Render the video first or add public/test-video.mp4.",
        },
        { status: 400 }
      )
    }

    const youtube = getYouTubeClient()

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],

      requestBody: {
        snippet: {
          title: post.title,
          description: post.description || "",
          tags: post.tags
            ? post.tags.split(",").map((t) => t.trim())
            : [],
        },

        status: {
          privacyStatus: "private",
          publishAt: post.scheduledFor
            ? new Date(post.scheduledFor).toISOString()
            : undefined,
        },
      },

      media: {
        body: fs.createReadStream(videoPath),
      },
    })

    const videoId = response.data.id

    const youtubeUrl = `https://youtube.com/watch?v=${videoId}`

    if (post.thumbnailImage) {
      try {
        const thumbnailPath = path.join(
          process.cwd(),
          "public",
          post.thumbnailImage.replace("/", "")
        )

        if (fs.existsSync(thumbnailPath)) {
          await youtube.thumbnails.set({
            videoId: videoId!,
            media: {
              body: fs.createReadStream(thumbnailPath),
            },
          })

          console.log("Thumbnail uploaded")
        }
      } catch (thumbError) {
        console.error("Thumbnail upload failed:", thumbError)
      }
    }

    const updated = await prisma.youTubePost.update({
      where: {
        id: post.id,
      },
      data: {
        youtubeVideoId: videoId,
        youtubeUrl,
        uploadStatus: "uploaded",
      },
    })

    return NextResponse.json({
      ok: true,
      youtubeUrl,
      post: updated,
    })
  } catch (error) {
    console.error("Real YouTube upload failed:", error)

    if (
      error instanceof Error &&
      error.message === "YouTube OAuth credentials are not configured"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "YouTube OAuth credentials are not configured",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        error: "YouTube upload failed",
      },
      { status: 500 }
    )
  }
}
