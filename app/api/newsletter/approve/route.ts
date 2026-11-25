import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireEditorAuth()
    if (!auth.ok) return auth.response

    const { newsletterId } = await req.json()

    if (!newsletterId) {
      return NextResponse.json(
        { ok: false, error: "Missing newsletterId" },
        { status: 400 }
      )
    }

    const newsletter = await prisma.newsletter.update({
      where: { id: newsletterId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: auth.actor,
      },
    })

    return NextResponse.json({
      ok: true,
      newsletter,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Approval failed",
      },
      { status: 500 }
    )
  }
}
