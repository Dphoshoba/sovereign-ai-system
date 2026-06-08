import { NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import { prisma } from "@/lib/prisma"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import type { ExecutiveMonthlyReview } from "@/lib/executive/monthly-review"

export const runtime = "nodejs"

function buildMonthlyReviewPdf(review: ExecutiveMonthlyReview) {
  const doc = new jsPDF()
  const margin = 14
  let y = 18

  function addHeading(text: string, size = 14) {
    doc.setFontSize(size)
    doc.text(text, margin, y)
    y += size === 20 ? 12 : 10

    if (y > 270) {
      doc.addPage()
      y = 18
    }
  }

  function addText(text: string, size = 11) {
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text || "", 180)
    doc.text(lines, margin, y)
    y += lines.length * 6 + 4

    if (y > 270) {
      doc.addPage()
      y = 18
    }
  }

  function addList(title: string, items: string[]) {
    addHeading(title, 13)

    if (items.length === 0) {
      addText("None recorded.")
      return
    }

    for (const item of items) {
      addText(`• ${item}`)
    }
  }

  addHeading("Echoes & Visions", 20)
  addHeading("Monthly Executive Review", 16)
  addText("")

  addHeading("Date Range", 13)
  addText(
    review.briefingCount > 0
      ? `${review.startDate} → ${review.endDate}`
      : "No archived briefings in the last 30 days"
  )

  addHeading("Average Health Score", 13)
  addText(String(review.averageHealthScore))

  addHeading("Best Health Score", 13)
  addText(String(review.bestHealthScore))

  addHeading("Worst Health Score", 13)
  addText(String(review.worstHealthScore))

  addHeading("Trend", 13)
  addText(
    `${review.healthTrend} (${review.healthScoreChange > 0 ? "+" : ""}${review.healthScoreChange} points, oldest → newest)`
  )

  addHeading("Monthly Summary", 13)
  addText(review.monthlySummary)

  addList("Wins", review.wins)
  addList("Risks", review.risks)
  addList("Recurring Issues", review.recurringIssues)

  addHeading("Revenue Movement", 13)
  addText(review.revenueMovement)

  addHeading("Growth Movement", 13)
  addText(review.growthMovement)

  addHeading("Delivery Movement", 13)
  addText(review.deliveryMovement)

  addList("Next Month Priorities", review.nextMonthPriorities)

  return doc
}

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
    const doc = buildMonthlyReviewPdf(review)
    const arrayBuffer = doc.output("arraybuffer")
    const pdfBuffer = Buffer.from(arrayBuffer)

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="executive-monthly-review.pdf"',
      },
    })
  } catch (error) {
    console.error("Monthly review PDF export failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Monthly review PDF export failed",
      },
      { status: 500 }
    )
  }
}
