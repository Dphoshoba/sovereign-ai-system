import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  generateDailyBriefing,
  getBriefingDateForToday,
} from "@/lib/executive/daily-briefing"

export async function GET() {
  try {
    const briefings = await prisma.executiveBriefing.findMany({
      orderBy: {
        briefingDate: "desc",
      },
      take: 90,
    })

    return NextResponse.json({
      ok: true,
      briefings,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch briefing archive",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const briefing = await generateDailyBriefing()
    const briefingDate = getBriefingDateForToday()

    const record = await prisma.executiveBriefing.upsert({
      where: {
        briefingDate,
      },
      create: {
        briefingDate,
        healthScore: briefing.healthScore,
        openingSummary: briefing.openingSummary,
        urgentCount: briefing.urgentCount,
        todayCount: briefing.todayCount,
        briefingJson: briefing,
      },
      update: {
        healthScore: briefing.healthScore,
        openingSummary: briefing.openingSummary,
        urgentCount: briefing.urgentCount,
        todayCount: briefing.todayCount,
        briefingJson: briefing,
      },
    })

    return NextResponse.json({
      ok: true,
      briefingId: record.id,
      archived: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to archive daily briefing",
      },
      { status: 500 }
    )
  }
}
