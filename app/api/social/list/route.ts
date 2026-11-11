import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET(req: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(req.url)

  const platform = searchParams.get("platform")
  const status = searchParams.get("status")

  const posts = await prisma.socialPost.findMany({
    where: {
      ...(platform ? { platform } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      article: true,
    },
  })

  return NextResponse.json({
    ok: true,
    count: posts.length,
    posts,
  })
}
