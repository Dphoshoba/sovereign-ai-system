import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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