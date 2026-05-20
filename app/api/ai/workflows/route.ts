import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const workflows = await prisma.aiWorkflow.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ ok: true, workflows })
  } catch (error) {
    console.error("Workflow fetch failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to fetch workflows" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const workflow = await prisma.aiWorkflow.create({
      data: {
        name: body.name,
        description: body.description || null,
        trigger: body.trigger,
        action: body.action,
        status: body.status || "active",
        config: body.config || {},
      },
    })

    return NextResponse.json({ ok: true, workflow })
  } catch (error) {
    console.error("Workflow save failed:", error)

    return NextResponse.json(
      { ok: false, error: "Failed to save workflow" },
      { status: 500 }
    )
  }
}