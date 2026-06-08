import { prisma } from "@/lib/prisma"

export const DECISION_STATUSES = [
  "proposed",
  "approved",
  "rejected",
  "completed",
] as const

export type DecisionStatus = (typeof DECISION_STATUSES)[number]

export type ExecutiveDecisionRecord = {
  id: string
  boardroomId: string | null
  title: string
  description: string | null
  category: string | null
  status: string
  outcome: string | null
  effectiveness: number | null
  createdAt: string
  updatedAt: string
}

export type DecisionMemory = {
  totalDecisions: number
  proposed: number
  approved: number
  completed: number
  averageEffectiveness: number
  decisions: ExecutiveDecisionRecord[]
}

export function isDecisionStatus(value: string): value is DecisionStatus {
  return DECISION_STATUSES.includes(value as DecisionStatus)
}

export function normalizeDecisionTitle(value: string) {
  return value
    .replace(/\s*\(supported by \d+ agents\)$/i, "")
    .trim()
    .toLowerCase()
}

export function toDecisionTitle(value: string) {
  return value.replace(/\s*\(supported by \d+ agents\)$/i, "").trim()
}

export function clampEffectiveness(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function serializeDecision(decision: {
  id: string
  boardroomId: string | null
  title: string
  description: string | null
  category: string | null
  status: string
  outcome: string | null
  effectiveness: number | null
  createdAt: Date
  updatedAt: Date
}): ExecutiveDecisionRecord {
  return {
    id: decision.id,
    boardroomId: decision.boardroomId,
    title: decision.title,
    description: decision.description,
    category: decision.category,
    status: decision.status,
    outcome: decision.outcome,
    effectiveness: decision.effectiveness,
    createdAt: decision.createdAt.toISOString(),
    updatedAt: decision.updatedAt.toISOString(),
  }
}

export function buildDecisionMemory(
  decisions: ExecutiveDecisionRecord[]
): DecisionMemory {
  const proposed = decisions.filter(
    (decision) => decision.status === "proposed"
  ).length
  const approved = decisions.filter(
    (decision) => decision.status === "approved"
  ).length
  const completed = decisions.filter(
    (decision) => decision.status === "completed"
  ).length

  const scored = decisions.filter(
    (decision) => decision.effectiveness !== null
  )
  const averageEffectiveness =
    scored.length > 0
      ? Math.round(
          scored.reduce(
            (sum, decision) => sum + (decision.effectiveness ?? 0),
            0
          ) / scored.length
        )
      : 0

  return {
    totalDecisions: decisions.length,
    proposed,
    approved,
    completed,
    averageEffectiveness,
    decisions,
  }
}

export async function saveBoardroomKeyDecisions(
  boardroomId: string,
  keyDecisions: string[]
) {
  const existing = await prisma.executiveDecision.findMany({
    select: {
      title: true,
    },
  })

  const existingTitles = new Set(
    existing.map((decision) => normalizeDecisionTitle(decision.title))
  )

  let created = 0

  for (const keyDecision of keyDecisions) {
    const title = toDecisionTitle(keyDecision)

    if (!title) {
      continue
    }

    const normalized = normalizeDecisionTitle(title)

    if (existingTitles.has(normalized)) {
      continue
    }

    await prisma.executiveDecision.create({
      data: {
        boardroomId,
        title,
        description: keyDecision,
        category: "boardroom",
        status: "proposed",
      },
    })

    existingTitles.add(normalized)
    created += 1
  }

  return created
}
