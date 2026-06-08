import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  buildQuarterlyReview,
  getCurrentQuarter,
  type ExecutiveQuarterlyReview,
} from "@/lib/executive/quarterly-review"

function serializeReview(record: {
  id: string
  quarter: string
  year: number
  healthScore: number | null
  executiveSummary: string | null
  reviewJson: unknown
  createdAt: Date
}) {
  const review = (record.reviewJson ?? null) as ExecutiveQuarterlyReview | null

  return {
    id: record.id,
    quarter: record.quarter,
    year: record.year,
    healthScore: record.healthScore,
    executiveSummary: record.executiveSummary,
    review,
    createdAt: record.createdAt.toISOString(),
  }
}

export async function GET() {
  try {
    const records = await prisma.executiveQuarterlyReview.findMany({
      orderBy: [{ year: "desc" }, { quarter: "desc" }],
    })

    return NextResponse.json({
      ok: true,
      reviews: records.map(serializeReview),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list quarterly reviews",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    let quarter = getCurrentQuarter().quarter
    let year = getCurrentQuarter().year

    try {
      const body = await request.json()
      if (typeof body?.quarter === "string" && body.quarter.trim()) {
        quarter = body.quarter.trim()
      }
      if (typeof body?.year === "number" && !Number.isNaN(body.year)) {
        year = body.year
      }
    } catch {
      // Empty body defaults to the current quarter.
    }

    const existing = await prisma.executiveQuarterlyReview.findUnique({
      where: {
        quarter_year: {
          quarter,
          year,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: `Quarterly review already exists for ${quarter} ${year}`,
          review: serializeReview(existing),
        },
        { status: 409 }
      )
    }

    const review = await buildQuarterlyReview(quarter, year)

    const record = await prisma.executiveQuarterlyReview.create({
      data: {
        quarter: review.quarter,
        year: review.year,
        healthScore: review.healthScore,
        executiveSummary: review.executiveSummary,
        reviewJson: review,
      },
    })

    return NextResponse.json({
      ok: true,
      review: serializeReview(record),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate quarterly review",
      },
      { status: 500 }
    )
  }
}
