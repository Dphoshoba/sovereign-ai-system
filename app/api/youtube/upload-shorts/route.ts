import fs from "fs"
import path from "path"

import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { youtube } from "@/lib/youtube"

export async function POST(req: Request) {
  try {
    const { youtubePostId } =
      await req.json()

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

    if (!post.shortsVideoUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Shorts video not rendered",
        },
        { status: 400 }
      )
    }

    const localPath = path.join(
      process.cwd(),
      "public",
      post.shortsVideoUrl.replace(
        "/",
        ""
      )
    )

    const response =
      await youtube.videos.insert({
        part: ["snippet", "status"],

        requestBody: {
          snippet: {
            title:
              `${post.title} #Shorts`,
            description:
              post.shortsCaption || "",
          },

          status: {
            privacyStatus: "private",
          },
        },

        media: {
          body: fs.createReadStream(
            localPath
          ),
        },
      })

    const videoId = response.data.id

    const youtubeUrl =
      `https://youtube.com/watch?v=${videoId}`

    const updated =
      await prisma.youTubePost.update({
        where: {
          id: post.id,
        },
        data: {
          shortsVideoId: videoId,
          shortsUploadUrl:
            youtubeUrl,
          shortsStatus: "uploaded",
        },
      })

    return NextResponse.json({
      ok: true,
      youtubeUrl,
      post: updated,
    })
  } catch (error) {
    console.error(
      "Shorts upload failed:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Upload failed",
      },
      { status: 500 }
    )
  }
}