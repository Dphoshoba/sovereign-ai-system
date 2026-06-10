import { NextResponse } from "next/server"
import {
  generateWeeklyExecutiveReview,
  generateMonthlyExecutiveReview,
  generateQuarterlyExecutiveReview,
  isExecutiveReviewPeriod,
} from "@/lib/executive/autonomous-review"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") ?? "weekly"

    if (!isExecutiveReviewPeriod(period)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Period must be weekly, monthly, or quarterly",
        },
        { status: 400 }
      )
    }

    const review =
      period === "weekly"
        ? await generateWeeklyExecutiveReview()
        : period === "monthly"
          ? await generateMonthlyExecutiveReview()
          : await generateQuarterlyExecutiveReview()

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
            : "Failed to generate autonomous executive review",
      },
      { status: 500 }
    )
  }
}
