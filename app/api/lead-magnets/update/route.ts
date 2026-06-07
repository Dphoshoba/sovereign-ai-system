import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { leadMagnetId, fileUrl } = await req.json()

    if (!leadMagnetId || !fileUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing leadMagnetId or fileUrl" },
        { status: 400 }
      )
    }

    const leadMagnet = await prisma.leadMagnet.update({
      where: { id: leadMagnetId },
      data: { fileUrl },
    })

    return NextResponse.json({
      ok: true,
      leadMagnet,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Lead magnet update failed",
      },
      { status: 500 }
    )
  }
}
