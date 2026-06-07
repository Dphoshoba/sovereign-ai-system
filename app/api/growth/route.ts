import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: {
        createdAt: "asc",
      },
    })

    const totalSubscribers = subscribers.length

    const activeSubscribers = subscribers.filter(
      (subscriber) => subscriber.status === "active"
    ).length

    const currentDate = new Date()

    const monthlySubscribers = subscribers.filter((subscriber) => {
      const createdAt = new Date(subscriber.createdAt)

      return (
        createdAt.getMonth() === currentDate.getMonth() &&
        createdAt.getFullYear() === currentDate.getFullYear()
      )
    }).length

    const growthRate =
      totalSubscribers > 0
        ? Math.round(
            (monthlySubscribers / totalSubscribers) * 100
          )
        : 0

    return NextResponse.json({
      ok: true,
      metrics: {
        totalSubscribers,
        activeSubscribers,
        monthlySubscribers,
        growthRate,
      },
      recentSubscribers: subscribers
        .slice(-10)
        .reverse()
        .map((subscriber) => ({
          id: subscriber.id,
          email: subscriber.email,
          status: subscriber.status,
          createdAt: subscriber.createdAt,
        })),
    })
  } catch (error) {
    console.error("Growth API failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Growth analytics failed",
      },
      { status: 500 }
    )
  }
}