import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const records = await prisma.revenueRecord.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    })

    const insights = await prisma.revenueInsight.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    const totalRevenue = records.reduce(
      (sum, record) => sum + record.amount,
      0
    )

    const recurringRevenue = records
      .filter((record) => record.recurring)
      .reduce((sum, record) => sum + record.amount, 0)

    const revenueByCategory = records.reduce((acc: any, record) => {
      acc[record.category] =
        (acc[record.category] || 0) + record.amount

      return acc
    }, {})

    const revenueBySource = records.reduce((acc: any, record) => {
      acc[record.source] =
        (acc[record.source] || 0) + record.amount

      return acc
    }, {})

    return NextResponse.json({
      ok: true,
      records,
      insights,
      metrics: {
        totalRevenue,
        recurringRevenue,
        revenueByCategory,
        revenueBySource,
      },
    })
  } catch (error) {
    console.error("Revenue fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch revenue data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const record = await prisma.revenueRecord.create({
      data: {
        source: body.source,
        category: body.category,
        clientName: body.clientName || null,
        amount: Number(body.amount),
        currency: body.currency || "AUD",
        recurring: Boolean(body.recurring),
        status: body.status || "received",
        notes: body.notes || null,
      },
    })

    await prisma.aiActivityEvent.create({
      data: {
        type: "revenue",
        title: `Revenue recorded: ${record.category}`,
        message: `${record.currency} ${record.amount}`,
        status: "success",
        metadata: {
          revenueId: record.id,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      record,
    })
  } catch (error) {
    console.error("Revenue save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save revenue record" },
      { status: 500 }
    )
  }
}