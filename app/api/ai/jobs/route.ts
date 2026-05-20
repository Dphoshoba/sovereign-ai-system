import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const jobs = await prisma.aiJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ ok: true, jobs })
  } catch (error) {
    console.error("Failed to fetch jobs:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch jobs" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const job = await prisma.aiJob.create({
      data: {
        type: body.type,
        payload: body.payload || {},
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
      },
    })

    return NextResponse.json({ ok: true, job })
  } catch (error) {
    console.error("Failed to create job:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to create job" },
      { status: 500 }
    )
  }
}