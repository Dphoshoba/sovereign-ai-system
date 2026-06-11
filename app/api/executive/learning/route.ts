import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serializeDecision } from "@/lib/executive/decision-memory"
import { generateExecutiveLearning } from "@/lib/executive/learning-engine"
import {
  buildExecutiveLearning,
  decisionsEligibleForLessonGeneration,
  serializeExecutiveLesson,
} from "@/lib/executive/learning-system"
import { EXECUTIVE_LIST_LIMITS } from "@/lib/executive/list-limits"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// GET is hard-minimal and production-safe: lightweight engine only, no
// persistence, no legacy aggregation, and never a 500 — failures degrade to a
// 200 fallback payload so the dashboard always renders.
export async function GET() {
  console.time("executive-learning-get")

  try {
    let engineError: string | null = null

    const engine = await generateExecutiveLearning({
      lightweight: true,
      skipPersistence: true,
    }).catch((error) => {
      engineError =
        error instanceof Error
          ? error.message
          : "Failed to generate executive learning"
      console.error("Learning engine failed:", error)
      return null
    })

    if (!engine) {
      return NextResponse.json({
        ok: true,
        learning: {
          lessons: [],
          engine: null,
          fallback: true,
          error: engineError ?? "Failed to generate executive learning",
        },
        storedLessons: [],
      })
    }

    return NextResponse.json({
      ok: true,
      learning: {
        lessons: [],
        engine,
      },
      storedLessons: [],
    })
  } catch (error) {
    // Last-resort guard — still no 500 for GET.
    return NextResponse.json({
      ok: true,
      learning: {
        lessons: [],
        engine: null,
        fallback: true,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build executive learning summary",
      },
      storedLessons: [],
    })
  } finally {
    console.timeEnd("executive-learning-get")
  }
}

export async function POST() {
  try {
    const [decisions, existingLessons] = await Promise.all([
      prisma.executiveDecision.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: EXECUTIVE_LIST_LIMITS.decisions,
      }),
      prisma.executiveLesson.findMany({
        select: { sourceDecisionId: true },
      }),
    ])

    const serializedDecisions = decisions.map(serializeDecision)
    const existingSourceIds = new Set(
      existingLessons
        .map((lesson) => lesson.sourceDecisionId)
        .filter((id): id is string => Boolean(id))
    )

    const eligible = decisionsEligibleForLessonGeneration(serializedDecisions)
    let created = 0

    for (const decision of eligible) {
      if (existingSourceIds.has(decision.id)) {
        continue
      }

      await prisma.executiveLesson.create({
        data: {
          title: decision.title,
          category: decision.category,
          lesson: decision.lessonLearned as string,
          impactArea: decision.impactArea,
          effectiveness: decision.effectiveness,
          sourceDecisionId: decision.id,
        },
      })

      existingSourceIds.add(decision.id)
      created += 1
    }

    const storedLessons = await prisma.executiveLesson.findMany({
      orderBy: [{ createdAt: "desc" }],
    })
    const serializedLessons = storedLessons.map(serializeExecutiveLesson)
    const learning = buildExecutiveLearning(
      serializedDecisions,
      serializedLessons
    )

    return NextResponse.json({
      ok: true,
      created,
      learning,
      storedLessons: serializedLessons,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate executive lessons",
      },
      { status: 500 }
    )
  }
}
