import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email is required",
        },
        { status: 400 }
      )
    }

    const existing = await prisma.subscriber.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    })

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadySubscribed: true,
        subscriber: existing,
      })
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email: email.toLowerCase().trim(),
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
            : "Subscription failed",
      },
      { status: 500 }
    )
  }
}