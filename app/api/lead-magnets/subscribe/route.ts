import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, leadMagnetId } = await req.json()

    if (!email || !leadMagnetId) {
      return NextResponse.json(
        { ok: false, error: "Missing email or leadMagnetId" },
        { status: 400 }
      )
    }

    const leadMagnet = await prisma.leadMagnet.findUnique({
      where: { id: leadMagnetId },
    })

    if (!leadMagnet) {
      return NextResponse.json(
        { ok: false, error: "Lead magnet not found" },
        { status: 404 }
      )
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      update: {
        status: "active",
      },
      create: {
        email,
        status: "active",
      },
    })

    const updatedLeadMagnet = await prisma.leadMagnet.update({
      where: { id: leadMagnetId },
      data: {
        downloads: {
          increment: 1,
        },
        subscribers: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      subscriber,
      leadMagnet: updatedLeadMagnet,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Lead magnet subscription failed",
      },
      { status: 500 }
    )
  }
}
