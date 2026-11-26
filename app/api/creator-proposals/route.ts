import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

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