import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json()

    await prisma.article.delete({
      where: {
        id: articleId,
      },
    })

    return NextResponse.json({
      ok: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Delete failed",
      },
      { status: 500 }
    )
  }
}