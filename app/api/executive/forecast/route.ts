import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildExecutiveForecast } from "@/lib/executive/forecast"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"

export async function GET() {
  try {
    const cutoff = getMonthlyReviewDateCutoff()

    const [snapshot, briefings] = await Promise.all([
      getExecutivePlatformSnapshot(),
      prisma.executiveBriefing.findMany({
        where: {
          briefingDate: {
            gte: cutoff,
          },
        },
        orderBy: {
          briefingDate: "desc",
        },
      }),
    ])

    const monthlyReview = buildExecutiveMonthlyReview(briefings)
    const forecast = buildExecutiveForecast({
      snapshot,
      briefings,
      monthlyReview,
    })

    return NextResponse.json({
      ok: true,
      forecast,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate executive forecast",
      },
      { status: 500 }
    )
  }
}
