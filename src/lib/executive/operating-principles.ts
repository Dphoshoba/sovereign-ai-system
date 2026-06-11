// Phase 26 — Operating principle derivation (pure, dependency-free).
// Shared by the learning engine and the knowledge graph builder so the graph
// can create principle nodes without importing the full learning chain.

export type OperatingPrinciple = {
  id: string
  principle: string
  source: "decision" | "lesson"
  sourceId: string
  sourceTitle: string
  confidence: number
}

export type PrincipleDecisionInput = {
  id: string
  title: string
  status: string
  effectiveness: number | null
  outcome: string | null
}

export type PrincipleLessonInput = {
  id: string
  title: string
  lesson: string
  effectiveness: number | null
  sourceDecisionId: string | null
}

const DECISION_PRINCIPLE_THRESHOLD = 60
const LESSON_PRINCIPLE_THRESHOLD = 70

/** Normalize effectiveness to 0-100 (seed data uses 1-5). */
export function normalizeEffectivenessScale(value: number | null) {
  if (value === null) {
    return null
  }

  const normalized = value <= 5 ? value * 20 : value
  return Math.max(0, Math.min(100, normalized))
}

function clampConfidence(value: number) {
  return Math.round(Math.max(0.3, Math.min(0.95, value)) * 100) / 100
}

/**
 * Derive standing operating principles from proven decisions and lessons.
 * Deterministic: implemented decisions and validated lessons with high
 * effectiveness become codified principles.
 */
export function deriveOperatingPrinciples(
  decisions: PrincipleDecisionInput[],
  lessons: PrincipleLessonInput[]
): OperatingPrinciple[] {
  const principles: OperatingPrinciple[] = []

  for (const decision of decisions) {
    if (decision.status !== "implemented") {
      continue
    }

    const effectiveness = normalizeEffectivenessScale(decision.effectiveness)

    if (effectiveness === null || effectiveness < DECISION_PRINCIPLE_THRESHOLD) {
      continue
    }

    principles.push({
      id: `principle-decision-${decision.id}`,
      principle: `"${decision.title}" should remain standard operating procedure.`,
      source: "decision",
      sourceId: decision.id,
      sourceTitle: decision.title,
      confidence: clampConfidence(
        0.5 + effectiveness / 250 + (decision.outcome?.trim() ? 0.1 : 0)
      ),
    })
  }

  for (const lesson of lessons) {
    const effectiveness = normalizeEffectivenessScale(lesson.effectiveness)

    if (effectiveness === null || effectiveness < LESSON_PRINCIPLE_THRESHOLD) {
      continue
    }

    const statement = lesson.lesson.trim()

    principles.push({
      id: `principle-lesson-${lesson.id}`,
      principle: statement.length > 0 && statement.length <= 180
        ? `${statement.replace(/\.+$/, "")}. Apply as a default practice.`
        : `"${lesson.title}" should be applied as a default practice.`,
      source: "lesson",
      sourceId: lesson.id,
      sourceTitle: lesson.title,
      confidence: clampConfidence(0.45 + effectiveness / 250),
    })
  }

  return principles.sort(
    (a, b) => b.confidence - a.confidence || a.principle.localeCompare(b.principle)
  )
}
