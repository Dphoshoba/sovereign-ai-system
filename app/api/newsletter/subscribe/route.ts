import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json()

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email is required",
        },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existing = await prisma.subscriber.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existing) {
      const subscriber = await prisma.subscriber.update({
        where: { email: normalizedEmail },
        data: {
          status: "active",
          source: source || "newsletter",
        },
      })

      return NextResponse.json({
        ok: true,
        alreadySubscribed: true,
        subscriber,
      })
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email: normalizedEmail,
        status: "active",
        source: source || "newsletter",
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