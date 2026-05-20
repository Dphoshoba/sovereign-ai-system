import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const articleCount = await prisma.article.count()

    return NextResponse.json({
      ok: true,
      database: "connected",
      articles: articleCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        ok: false,
        error: "Database connection failed",
      },
      { status: 500 }
    )
  }
}