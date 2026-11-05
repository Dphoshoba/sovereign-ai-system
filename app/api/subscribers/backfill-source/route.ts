import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"

export async function POST() {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const result = await prisma.subscriber.updateMany({
      where: {
        source: null,
      },
      data: {
        source: "legacy",
      },
    })

    return NextResponse.json({
      ok: true,
      updated: result.count,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Backfill failed",
      },
      { status: 500 }
    )
  }
}
