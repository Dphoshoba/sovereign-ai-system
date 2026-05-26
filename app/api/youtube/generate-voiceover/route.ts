import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOpenAI } from "@/lib/ai/openai"
import { writeFile } from "fs/promises"
import path from "path"

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

    const script =
      post.fullScript ||
      post.scriptOutline ||
      post.description

    const speech = await getOpenAI().audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: script,
    })

    const buffer = Buffer.from(await speech.arrayBuffer())

    const fileName = `${safeFileName(post.title)}-${Date.now()}.mp3`

    const filePath = path.join(
      process.cwd(),
      "public",
      "voiceovers",
      fileName
    )

    await writeFile(filePath, buffer)

    const audioUrl = `/voiceovers/${fileName}`

    const updated = await prisma.youTubePost.update({
      where: {
        id: post.id,
      },
      data: {
        voiceoverUrl: audioUrl,
      },
    })

    return NextResponse.json({
      ok: true,
      audioUrl,
      post: updated,
    })
  } catch (error) {
    console.error("Voiceover generation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate voiceover",
      },
      { status: 500 }
    )
  }
}