import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const memories = await prisma.aiMemory.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      memories,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch memories" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {}
    const title = typeof record.title === "string" ? record.title.trim() : ""
    const content = typeof record.content === "string" ? record.content.trim() : ""
    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: "A title and content are required." },
        { status: 400 }
      )
    }

    const memory = await prisma.aiMemory.create({
      data: {
        type:
          typeof record.type === "string" && record.type.trim()
            ? record.type.trim()
            : "general",
        title,
        content,
        source: typeof record.source === "string" ? record.source : null,
        tags: typeof record.tags === "string" ? record.tags : null,
      },
    })

    return NextResponse.json({
      ok: true,
      memory,
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to save memory" },
      { status: 500 }
    )
  }
}
