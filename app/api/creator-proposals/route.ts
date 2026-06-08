import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const proposals = await prisma.creatorProposal.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    })

    return NextResponse.json({
      ok: true,
      proposals,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch proposals",
      },
      { status: 500 }
    )
  }
}