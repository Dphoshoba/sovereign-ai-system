import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serializeDecision } from "@/lib/executive/decision-memory"
import {
  buildExecutiveLearning,
  decisionsEligibleForLessonGeneration,
  serializeExecutiveLesson,
} from "@/lib/executive/learning-system"

export async function GET() {
  try {
    const [decisions, storedLessons] = await Promise.all([
      prisma.executiveDecision.findMany({
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.executiveLesson.findMany({
        orderBy: [{ createdAt: "desc" }],
      }),
    ])

    const serializedDecisions = decisions.map(serializeDecision)
    const serializedLessons = storedLessons.map(serializeExecutiveLesson)
    const learning = buildExecutiveLearning(
      serializedDecisions,
      serializedLessons
    )

    return NextResponse.json({
      ok: true,
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
            : "Failed to build executive learning summary",
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const [decisions, existingLessons] = await Promise.all([
      prisma.executiveDecision.findMany({
        orderBy: [{ createdAt: "desc" }],
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
