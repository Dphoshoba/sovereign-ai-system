import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json()

    const article = await prisma.article.update({
      where: {
        id: articleId,
      },
      data: {
        status: "archived",
      },
    })

    return NextResponse.json({
      ok: true,
      article,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Archive failed",
      },
      { status: 500 }
    )
  }
}