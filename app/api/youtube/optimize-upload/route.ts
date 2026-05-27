import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function chooseBestThumbnail(thumbnails: string[]) {
  return thumbnails[0] || ""
}

function chooseBestShort(shorts: string[]) {
  return shorts[0] || ""
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { youtubePostId } = body

    if (!youtubePostId) {
      return NextResponse.json(
        { ok: false, error: "youtubePostId required" },
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
        { ok: false, error: "Post not found" },
        { status: 404 }
      )
    }

    const titles =
      typeof post.generatedTitles === "string"
        ? JSON.parse(post.generatedTitles)
        : []

    const thumbnails =
      typeof post.generatedThumbnails === "string"
        ? JSON.parse(post.generatedThumbnails)
        : []

    const shorts =
      typeof post.generatedShorts === "string"
        ? JSON.parse(post.generatedShorts)
        : []

    const bestTitle =
      titles.sort((a: any, b: any) => b.score - a.score)[0] || null

    const uploadPackage = {
      title: bestTitle?.title || post.title,
      thumbnail: chooseBestThumbnail(thumbnails),
      short: chooseBestShort(shorts),
      description: post.description || "",
      tags: post.tags || "",
      videoUrl: post.renderedVideoUrl || "",
    }

    return NextResponse.json({
      ok: true,
      uploadPackage,
    })
  } catch (error) {
    console.error("Upload optimization failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "Upload optimization failed",
      },
      {
        status: 500,
      }
    )
  }
}