import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { mkdir } from "fs/promises"
import path from "path"
import sharp from "sharp"
function safeFileName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function POST(req: Request) {
  try {
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
          error: "YouTube post not found",
        },
        { status: 404 }
      )
    }

    const prompt =
      post.thumbnailPrompt ||
      `Create a cinematic YouTube thumbnail for: ${post.title}`

    const image = await getOpenAI().images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1792x1024",
    })

    const base64 = image.data?.[0]?.b64_json

    if (!base64) {
      return NextResponse.json(
        {
          ok: false,
          error: "No image generated",
        },
        { status: 500 }
      )
    }

    const fileName = `${safeFileName(post.title)}-${Date.now()}.jpg`

    const filePath = path.join(
      process.cwd(),
      "public",
      "youtube-thumbnails",
      fileName
    )

    const buffer = Buffer.from(base64, "base64")

    await mkdir(path.dirname(filePath), { recursive: true })

    await sharp(buffer)
      .jpeg({ quality: 82 })
      .toFile(filePath)

    const imageUrl = `/youtube-thumbnails/${fileName}`

    const updated = await prisma.youTubePost.update({
      where: {
        id: post.id,
      },
      data: {
        thumbnailImage: imageUrl,
      },
    })

    return NextResponse.json({
      ok: true,
      imageUrl,
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
