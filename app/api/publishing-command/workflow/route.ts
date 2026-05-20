import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.assetId || !body.status) {
      return NextResponse.json(
        { ok: false, error: "assetId and status are required" },
        { status: 400 }
      )
    }

    const asset = await prisma.youTubePublishingAsset.update({
      where: { id: body.assetId },
      data: {
        status: body.status,
        publishAt: body.publishAt ? new Date(body.publishAt) : undefined,
      },
    })

    const event = await prisma.publishingWorkflowEvent.create({
      data: {
        assetId: asset.id,
        eventType: "status-change",
        title: `${asset.title} moved to ${body.status}`,
        status: "completed",
        notes: body.notes || null,
        metadata: {
          newStatus: body.status,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      asset,
      event,
    })
  } catch (error) {
    console.error("Publishing workflow update failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Publishing workflow update failed",
      },
      { status: 500 }
    )
  }
}