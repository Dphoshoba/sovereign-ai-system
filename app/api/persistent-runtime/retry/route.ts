import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.retryId) {
      return NextResponse.json(
        { ok: false, error: "retryId is required" },
        { status: 400 }
      )
    }

    const retry = await prisma.runtimeRetryQueue.findUnique({
      where: { id: body.retryId },
    })

    if (!retry) {
      return NextResponse.json(
        { ok: false, error: "Retry item not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.runtimeRetryQueue.update({
      where: { id: retry.id },
      data: {
        attempts: retry.attempts + 1,
        status:
          retry.attempts + 1 >= retry.maxAttempts
            ? "max-attempts-reached"
            : "retried",
        nextRetryAt:
          retry.attempts + 1 >= retry.maxAttempts
            ? null
            : new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    await prisma.operationalEvent.create({
      data: {
        type: "runtime-retry-attempted",
        source: "persistent-runtime",
        title: `Retry attempted: ${retry.title}`,
        message: retry.error || null,
        severity: "medium",
        entityType: "RuntimeRetryQueue",
        entityId: retry.id,
        payload: {
          retryId: retry.id,
          attempts: updated.attempts,
        },
      },
    })

    return NextResponse.json({
      ok: true,
      retry: updated,
    })
  } catch (error) {
    console.error("Runtime retry failed:", error)

    return NextResponse.json(
      { ok: false, error: "Runtime retry failed" },
      { status: 500 }
    )
  }
}