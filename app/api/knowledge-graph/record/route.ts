import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

function hashText(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.title || !body.content) {
      return NextResponse.json(
        { ok: false, error: "title and content are required" },
        { status: 400 }
      )
    }

    const org = body.organizationId
      ? await prisma.sovereignOrganization.findUnique({
          where: { id: body.organizationId },
        })
      : await prisma.sovereignOrganization.findUnique({
          where: { slug: "echoes-visions" },
        })

    const workspace = org
      ? await prisma.organizationWorkspace.findFirst({
          where: { organizationId: org.id },
          orderBy: { createdAt: "asc" },
        })
      : null

    const record = await prisma.semanticKnowledgeRecord.create({
      data: {
        organizationId: org?.id || null,
        workspaceId: body.workspaceId || workspace?.id || null,
        title: body.title,
        content: body.content,
        recordType: body.recordType || "manual-memory",
        sourceLayer: body.sourceLayer || "manual",
        sourceType: body.sourceType || null,
        sourceId: body.sourceId || null,
        importance: body.importance || 70,
        confidence: body.confidence || 0.9,
        tags: body.tags || [],
        metadata: body.metadata || {},
        status: "active",
      },
    })

    const index = await prisma.semanticEmbeddingIndex.create({
      data: {
        knowledgeId: record.id,
        organizationId: record.organizationId,
        workspaceId: record.workspaceId,
        vectorHash: hashText(record.content),
        dimensions: 1536,
        contentPreview: record.content.slice(0, 280),
        metadata: {
          note: "Placeholder vector index. Upgrade to pgvector for true similarity search.",
        },
      },
    })

    return NextResponse.json({
      ok: true,
      record,
      index,
    })
  } catch (error) {
    console.error("Manual memory creation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Manual memory creation failed",
      },
      { status: 500 }
    )
  }
}