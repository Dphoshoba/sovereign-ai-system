import { NextResponse } from "next/server"
import {
  generateDecisionPackages,
  summarizeDecisionPackages,
} from "@/lib/executive/decision-packages"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const packages = await generateDecisionPackages()

    return NextResponse.json({
      ok: true,
      packages,
      summary: summarizeDecisionPackages(packages),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate decision packages",
      },
      { status: 500 }
    )
  }
}
