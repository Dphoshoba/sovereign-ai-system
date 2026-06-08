import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildExecutiveForecast } from "@/lib/executive/forecast"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import { buildStrategicPlan } from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"

export async function GET() {
  try {
    const cutoff = getMonthlyReviewDateCutoff()

    const [snapshot, briefings, leads] = await Promise.all([
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
      prisma.creatorLead.findMany(),
    ])

    const monthlyReview = buildExecutiveMonthlyReview(briefings)
    const weeklyReview = buildExecutiveWeeklyReview(briefings.slice(0, 7))
    const forecast = buildExecutiveForecast({
      snapshot,
      briefings,
      monthlyReview,
    })
    const recommendations = buildExecutiveRecommendations(snapshot)
    const proposalSentLeads = leads.filter(
      (lead) => lead.status === "proposal-sent"
    ).length

    const plan = buildStrategicPlan({
      snapshot,
      forecast,
      monthlyReview,
      weeklyReview,
      recommendations,
      proposalSentLeads,
    })

    return NextResponse.json({
      ok: true,
      plan,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate strategic plan",
      },
      { status: 500 }
    )
  }
}
