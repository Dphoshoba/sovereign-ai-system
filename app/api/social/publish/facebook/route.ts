import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../../lib/publishing/require-editor-auth"
import {
  publishApprovedFacebookPost,
  type FacebookPublishStore,
} from "../../../../../lib/social/facebook-publish"
import { DEFAULT_FACEBOOK_GRAPH_VERSION } from "../../../../../lib/social/facebook-oauth"

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

    const result = await publishApprovedFacebookPost({
      postId,
      store: prisma as unknown as FacebookPublishStore,
      requireCanonicalUrl: true,
      graphVersion:
        process.env.FACEBOOK_GRAPH_API_VERSION?.trim() ||
        DEFAULT_FACEBOOK_GRAPH_VERSION,
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Facebook publish failed",
      },
      { status: 500 },
    )
  }
}
