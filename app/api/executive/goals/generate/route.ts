import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildExecutiveForecast } from "@/lib/executive/forecast"
import {
  buildExecutiveMonthlyReview,
  getMonthlyReviewDateCutoff,
} from "@/lib/executive/monthly-review"
import { getExecutivePlatformSnapshot } from "@/lib/executive/platform-snapshot"
import { buildExecutiveRecommendations } from "@/lib/executive/recommendations"
import {
  buildQuarterlyGoals,
  normalizeGoalTitle,
} from "@/lib/executive/quarterly-goals"
import { buildStrategicPlan } from "@/lib/executive/strategic-plan"
import { buildExecutiveWeeklyReview } from "@/lib/executive/weekly-review"

export async function POST() {
  try {
    const cutoff = getMonthlyReviewDateCutoff()

    const [snapshot, briefings, leads, initiatives, existingGoals] =
      await Promise.all([
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
        prisma.strategicInitiative.findMany({
          select: {
            status: true,
          },
        }),
        prisma.quarterlyGoal.findMany({
          select: {
            title: true,
            quarter: true,
            year: true,
          },
        }),
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

    const generated = buildQuarterlyGoals({
      plan,
      forecast,
      snapshot,
      initiativeStats: {
        total: initiatives.length,
        completed: initiatives.filter((item) => item.status === "completed")
          .length,
      },
    })

    const existingKeys = new Set(
      existingGoals.map(
        (goal) =>
          `${goal.year}:${goal.quarter}:${normalizeGoalTitle(goal.title)}`
      )
    )

    let created = 0
    let skipped = 0
    const createdTitles: string[] = []

    for (const goal of generated.goals) {
      const key = `${generated.year}:${generated.quarter}:${normalizeGoalTitle(goal.title)}`

      if (existingKeys.has(key)) {
        skipped += 1
        continue
      }

      await prisma.quarterlyGoal.create({
        data: {
          title: goal.title,
          description: goal.description,
          quarter: generated.quarter,
          year: generated.year,
          category: goal.category,
          status: "planned",
          targetValue: goal.targetValue,
          currentValue: goal.currentValue,
          progress: goal.progress,
          owner: "executive",
        },
      })

      existingKeys.add(key)
      created += 1
      createdTitles.push(goal.title)
    }

    return NextResponse.json({
      ok: true,
      created,
      skipped,
      quarter: generated.quarter,
      year: generated.year,
      createdTitles,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate quarterly goals",
      },
      { status: 500 }
    )
  }
}
