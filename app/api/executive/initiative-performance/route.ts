import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateInitiativePerformance } from "@/lib/executive/initiative-performance"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const [initiatives, goals] = await Promise.all([
      prisma.strategicInitiative.findMany({
        select: {
          id: true,
          goalId: true,
          status: true,
          progress: true,
        },
      }),
      prisma.quarterlyGoal.findMany({
        select: {
          id: true,
          title: true,
          targetValue: true,
          currentValue: true,
          progress: true,
          status: true,
        },
      }),
    ])

    const performance = calculateInitiativePerformance(initiatives, goals)

    return NextResponse.json({
      ok: true,
      performance,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate initiative performance",
      },
      { status: 500 }
    )
  }
}
