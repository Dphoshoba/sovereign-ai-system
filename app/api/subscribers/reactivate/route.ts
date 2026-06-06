import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { subscriberId } = await req.json()

    if (!subscriberId) {
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
        status: "active",
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
            : "Failed to reactivate",
      },
      { status: 500 }
    )
  }
}