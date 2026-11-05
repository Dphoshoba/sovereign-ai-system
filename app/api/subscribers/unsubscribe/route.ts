import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"

export async function POST(req: NextRequest) {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  try {
    const { subscriberId } = await req.json()

    if (typeof subscriberId !== "string" || !subscriberId.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing subscriberId",
        },
        { status: 400 }
      )
    }

    const subscriber = await prisma.subscriber.update({
      where: {
        id: subscriberId,
      },
      data: {
        status: "unsubscribed",
      },
    })

    return NextResponse.json({
      ok: true,
      subscriber,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to unsubscribe",
      },
      { status: 500 }
    )
  }
}
