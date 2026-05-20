import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.signalId || !body.action) {
      return NextResponse.json(
        { ok: false, error: "signalId and action are required" },
        { status: 400 }
      )
    }

    const signal = await prisma.externalIntelligenceSignal.findUnique({
      where: { id: body.signalId },
    })

    if (!signal) {
      return NextResponse.json(
        { ok: false, error: "External intelligence signal not found" },
        { status: 404 }
      )
    }

    if (body.action === "convert-to-strategy") {
      const initiative = await prisma.strategicInitiative.create({
        data: {
          title: `External Signal Initiative: ${signal.title}`,
          description: signal.summary || null,
          priority: signal.relevanceScore >= 80 ? "high" : "medium",
          status: "proposed",
          ownerSystem: "strategy",
          targetOutcome: signal.opportunity
            ? "Convert external opportunity into strategic action."
            : "Reduce external strategic risk.",
          riskLevel: signal.severity,
          executionPath: [
            "Review signal",
            "Validate opportunity or risk",
            "Create campaign or defensive response",
            "Monitor outcome",
          ],
        },
      })

      await prisma.externalIntelligenceSignal.update({
        where: { id: signal.id },
        data: { status: "converted" },
      })

      await prisma.operationalEvent.create({
        data: {
          type: "external-signal-converted",
          source: "global-intelligence-mesh",
          title: signal.title,
          message: "External signal converted into strategic initiative.",
          severity: signal.severity,
          entityType: "StrategicInitiative",
          entityId: initiative.id,
          payload: {
            signalId: signal.id,
            initiativeId: initiative.id,
          },
        },
      })

      return NextResponse.json({
        ok: true,
        result: initiative,
      })
    }

    if (body.action === "store-memory") {
      const memory = await prisma.creatorLearningMemory.create({
        data: {
          type: "external-intelligence",
          title: signal.title,
          insight: signal.summary || signal.title,
          confidence: Math.min(signal.relevanceScore / 100, 0.95),
          priority: signal.relevanceScore >= 80 ? "high" : "medium",
          status: "active",
          evidence: {
            signalId: signal.id,
            sourceName: signal.sourceName,
            category: signal.category,
          },
        },
      })

      await prisma.externalIntelligenceSignal.update({
        where: { id: signal.id },
        data: { status: "stored" },
      })

      return NextResponse.json({
        ok: true,
        result: memory,
      })
    }

    if (body.action === "dismiss") {
      const updated = await prisma.externalIntelligenceSignal.update({
        where: { id: signal.id },
        data: { status: "dismissed" },
      })

      return NextResponse.json({
        ok: true,
        result: updated,
      })
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("External signal action failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "External signal action failed",
      },
      { status: 500 }
    )
  }
}