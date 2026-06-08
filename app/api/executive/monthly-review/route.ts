import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"

export async function GET() {
  try {
    const cutoff = getMonthlyReviewDateCutoff()

    const briefings = await prisma.executiveBriefing.findMany({
      where: {
        briefingDate: {
          gte: cutoff,
        },
      },
      orderBy: {
        briefingDate: "desc",
      },
    })

    const review = buildExecutiveMonthlyReview(briefings)

    return NextResponse.json({
      ok: true,
      review,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate monthly review",
      },
      { status: 500 }
    )
  }
}
