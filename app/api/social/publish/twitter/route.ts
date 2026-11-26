import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTwitterClient } from "@/lib/twitter"
import { getPlatformCapabilities } from "@/lib/platform/execution/provider-contracts/social-provider"
import { requirePublishingEditor } from "../../../../../lib/publishing/require-editor-auth"
import {
  publishApprovedTwitterPost,
  type TwitterPublishStore,
} from "../../../../../lib/social/publish-twitter-post"

export async function POST(req: Request) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  const caps = getPlatformCapabilities("twitter")
  if (caps.publishStatus !== "publish_capable") {
    return NextResponse.json(
      { ok: false, error: "Twitter publishing is not currently available" },
      { status: 503 },
    )
  }

  let postId: unknown
  try {
    const body = await req.json()
    postId = body?.postId
  } catch {
    return NextResponse.json(
      { ok: false, error: "Missing postId" },
      { status: 400 },
    )
  }

  if (!postId || typeof postId !== "string") {
    return NextResponse.json(
      { ok: false, error: "Missing postId" },
      { status: 400 },
    )
  }

  const result = await publishApprovedTwitterPost({
    postId,
    actor: auth.actor,
    store: prisma as unknown as TwitterPublishStore,
    createClient: () => getTwitterClient(),
  })

  return NextResponse.json(result.body, { status: result.status })
}
