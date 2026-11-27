import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../../lib/publishing/require-editor-auth"
import {
  publishApprovedThreadsPost,
  type ThreadsPublishStore,
} from "../../../../../lib/social/threads-publish"

export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const { postId } = await req.json()

    if (!postId || typeof postId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing postId" },
        { status: 400 },
      )
    }

    const result = await publishApprovedThreadsPost({
      postId,
      store: prisma as unknown as ThreadsPublishStore,
      requireCanonicalUrl: true,
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Threads publish failed",
      },
      { status: 500 },
    )
  }
}
