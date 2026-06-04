import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json(
        { ok: false, error: "Missing postId" },
        { status: 400 }
      )
    }

    const post = await prisma.socialPost.update({
      where: {
        id: postId,
      },
      data: {
        status: "rejected",
      },
    })

    return NextResponse.json({
      ok: true,
      post,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Rejection failed",
      },
      { status: 500 }
    )
  }
}
