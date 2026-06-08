import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"

export async function GET() {
  try {
    const briefings = await prisma.executiveBriefing.findMany({
      orderBy: {
        briefingDate: "desc",
      },
      take: 7,
    })

    const review = buildExecutiveWeeklyReview(briefings)

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
            : "Failed to generate weekly review",
      },
      { status: 500 }
    )
  }
}
