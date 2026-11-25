import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const clients = await prisma.clientProfile.findMany({
      where: {
        type: "client",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      ok: true,
      clients,
    })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch clients",
      },
      { status: 500 }
    )
  }
}
