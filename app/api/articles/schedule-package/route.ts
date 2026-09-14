import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseSchedulingTimestamp } from "../../../../lib/publishing/adelaide-time"

export async function POST(req: NextRequest) {
  try {
    const { articleId, scheduledFor } = await req.json()

    if (!articleId || !scheduledFor) {
      return NextResponse.json(
        { ok: false, error: "Missing articleId or scheduledFor" },
        { status: 400 }
      )
    }

    const parsed = parseSchedulingTimestamp(scheduledFor)
    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, error: parsed.error },
        { status: 400 }
      )
    }

    const scheduleDate = parsed.date

    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "scheduled",
        scheduledFor: scheduleDate,
      },
    })

    await prisma.newsletter.updateMany({
      where: { articleId },
      data: {
        status: "approved",
        scheduledFor: scheduleDate,
      },
    })

    await prisma.socialPost.updateMany({
      where: { articleId },
      data: {
        status: "approved",
        scheduledFor: scheduleDate,
      },
    })

    return NextResponse.json({
      ok: true,
      article,
      message: "Package scheduled successfully.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Schedule failed",
      },
      { status: 500 }
    )
  }
}