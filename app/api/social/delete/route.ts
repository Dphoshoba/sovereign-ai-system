import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: Request) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json(
        { ok: false, error: "Missing postId" },
        { status: 400 }
      )
    }

    await prisma.socialPost.delete({
      where: { id: postId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 500 }
    )
  }
}
