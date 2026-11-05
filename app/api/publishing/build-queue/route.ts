import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth";

export async function POST(req: Request) {
  try {
    const auth = await requireEditorAuth();
    if (!auth.ok) return auth.response;

    const { queueId, status, scheduledAt } = await req.json();

    if (!queueId || !status) {
      return NextResponse.json(
        { ok: false, error: "Missing queueId or status" },
        { status: 400 },
      );
    }

    if (status === "published") {
      return NextResponse.json(
        {
          ok: false,
          code: "GOVERNED_PUBLICATION_ROUTE_REQUIRED",
          error:
            "Queue publication must use the governed publishing status endpoint.",
          articleUnchanged: true,
        },
        { status: 409 },
      );
    }

    const updated = await prisma.publishingQueue.update({
      where: { id: queueId },
      data: {
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      item: updated,
    });
  } catch (error) {
    console.error("Queue update failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update queue",
      },
      { status: 500 },
    );
  }
}
