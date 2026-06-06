import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }

  return Math.round(((current - previous) / previous) * 100)
}

export async function GET() {
  const snapshots = await prisma.monthlySnapshot.findMany({
    orderBy: {
      month: "desc",
    },
    take: 2,
  })

  const current = snapshots[0] || null
  const previous = snapshots[1] || null

  if (!current) {
    return NextResponse.json({
      ok: true,
      current: null,
      previous: null,
      trends: null,
      message: "No snapshots available yet.",
    })
  }

  const baseline = previous || {
    articlesPublished: 0,
    socialPublished: 0,
    newslettersSent: 0,
    subscribers: 0,
  }

  const trends = {
    articlesPublished: {
      current: current.articlesPublished,
      previous: baseline.articlesPublished,
      change: percentChange(
        current.articlesPublished,
        baseline.articlesPublished
      ),
    },

    socialPublished: {
      current: current.socialPublished,
      previous: baseline.socialPublished,
      change: percentChange(
        current.socialPublished,
        baseline.socialPublished
      ),
    },

    newslettersSent: {
      current: current.newslettersSent,
      previous: baseline.newslettersSent,
      change: percentChange(
        current.newslettersSent,
        baseline.newslettersSent
      ),
    },

    subscribers: {
      current: current.subscribers,
      previous: baseline.subscribers,
      change: percentChange(
        current.subscribers,
        baseline.subscribers
      ),
    },
  }

  return NextResponse.json({
    ok: true,
    current,
    previous,
    trends,
  })
}