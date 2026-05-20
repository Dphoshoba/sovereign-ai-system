import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Lead ID is required" },
        { status: 400 }
      )
    }

    const lead = await prisma.creatorLead.update({
      where: { id: body.id },
      data: {
        status: body.status,
        leadScore:
          typeof body.leadScore === "number" ? body.leadScore : undefined,
        readiness: body.readiness,
        niche: body.niche,
        bottlenecks: body.bottlenecks,
        notes: body.notes,
        projectedValue:
          body.projectedValue === "" || body.projectedValue === null
            ? null
            : body.projectedValue !== undefined
              ? Number(body.projectedValue)
              : undefined,
      },
    })

    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error("Creator lead update failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update lead",
      },
      { status: 500 }
    )
  }
}