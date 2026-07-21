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
  actionTaken: string | null
  lessonLearned: string | null
  reviewDate: string | null
  impactArea: string | null
  followUpRequired: boolean
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
  actionTaken: string | null
  lessonLearned: string | null
  reviewDate: Date | null
  impactArea: string | null
  followUpRequired: boolean
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
    actionTaken: decision.actionTaken,
    lessonLearned: decision.lessonLearned,
    reviewDate: decision.reviewDate?.toISOString() ?? null,
    impactArea: decision.impactArea,
    followUpRequired: decision.followUpRequired,
    createdAt: decision.createdAt.toISOString(),
    updatedAt: decision.updatedAt.toISOString(),
  }
}

export function buildDecisionMemory(
  decisions: ExecutiveDecisionRecord[]
): DecisionMemory {
  const proposed = decisions.filter(d => d.status === "proposed").length
  const approved = decisions.filter(d => d.status === "approved").length
  const completed = decisions.filter(d => d.status === "completed").length

  const scored = decisions.filter(d => d.effectiveness !== null)
  const averageEffectiveness = scored.length > 0
    ? Math.round(scored.reduce((sum, d) => sum + (d.effectiveness ?? 0), 0) / scored.length)
    : 0

  return { totalDecisions: decisions.length, proposed, approved, completed, averageEffectiveness, decisions }
}

export async function saveBoardroomKeyDecisions(boardroomId: string, keyDecisions: string[]) {
  const existing = await prisma.executiveDecision.findMany({ select: { title: true } })
  const existingTitles = new Set(existing.map(d => normalizeDecisionTitle(d.title)))
  let created = 0

  for (const keyDecision of keyDecisions) {
    const title = toDecisionTitle(keyDecision)
    if (!title) continue
    const normalized = normalizeDecisionTitle(title)
    if (existingTitles.has(normalized)) continue

    await prisma.executiveDecision.create({
      data: { boardroomId, title, description: keyDecision, category: "boardroom", status: "proposed" },
    })
    existingTitles.add(normalized)
    created += 1
  }
  return created
}

export async function loadDecisionRecords(): Promise<ExecutiveDecisionRecord[]> {
  const decisions = await prisma.executiveDecision.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return decisions.map(serializeDecision)
}

export async function recordBoardroomDecision(
  boardroomId: string, title: string, description: string, category: string
): Promise<ExecutiveDecisionRecord> {
  const decision = await prisma.executiveDecision.create({
    data: { boardroomId, title, description, category, status: "proposed" },
  })
  return serializeDecision(decision)
}

export async function updateDecisionOutcome(
  decisionId: string, outcome: string, effectiveness: number, actionTaken: string, lessonLearned: string
): Promise<ExecutiveDecisionRecord> {
  const decision = await prisma.executiveDecision.update({
    where: { id: decisionId },
    data: { outcome, effectiveness, actionTaken, lessonLearned, status: "completed" },
  })
  return serializeDecision(decision)
}

export interface DecisionOutcome {
  decisionId: string
  decisionTitle: string
  category: string
  status: 'successful' | 'mixed' | 'failed' | 'pending'
  adoptedAt: number
  reviewedAt: number
  outcomeSummary: string
  lessonsLearned: string[]
  confidenceAdjustment: number
  recurringPatterns: string[]
  relatedDecisions: string[]
  evidenceIds: string[]
}

export interface DecisionMemorySnapshot {
  totalDecisions: number
  successfulOutcomes: number
  failedOutcomes: number
  confidenceAdjustments: number
  recurringSuccesses: string[]
  recurringFailures: string[]
  lessonsCount: number
  assessedAt: number
}

export function recordDecisionOutcome(params: {
  decisionTitle: string
  category: string
  status: DecisionOutcome['status']
  outcomeSummary: string
  lessonsLearned: string[]
  evidenceIds: string[]
}): DecisionOutcome {
  const now = Date.now()
  const confidenceAdjustment = params.status === 'successful' ? 0.05 : params.status === 'failed' ? -0.10 : 0
  return {
    decisionId: `dec-outcome-${now}`,
    decisionTitle: params.decisionTitle,
    category: params.category,
    status: params.status,
    adoptedAt: now,
    reviewedAt: now,
    outcomeSummary: params.outcomeSummary,
    lessonsLearned: params.lessonsLearned,
    confidenceAdjustment,
    recurringPatterns: [],
    relatedDecisions: [],
    evidenceIds: params.evidenceIds,
  }
}

export function adjustConfidenceFromMemory(
  currentConfidence: number,
  outcomes: DecisionOutcome[]
): { adjustedConfidence: number; adjustmentReason: string } {
  if (outcomes.length === 0) return { adjustedConfidence: currentConfidence, adjustmentReason: 'No historical data' }
  const adjustments = outcomes.map(o => o.confidenceAdjustment)
  const totalAdjustment = adjustments.reduce((s, a) => s + a, 0) / adjustments.length
  const successes = outcomes.filter(o => o.status === 'successful').length
  const failures = outcomes.filter(o => o.status === 'failed').length
  let reason = `${outcomes.length} historical decisions: ${successes} successful, ${failures} failed`
  if (failures > successes) reason += ' — caution warranted'
  return {
    adjustedConfidence: Math.max(0, Math.min(1, Math.round((currentConfidence + totalAdjustment) * 100) / 100)),
    adjustmentReason: reason,
  }
}

export function analyzeDecisionMemory(outcomes: DecisionOutcome[]): DecisionMemorySnapshot {
  const successes = outcomes.filter(o => o.status === 'successful')
  const failures = outcomes.filter(o => o.status === 'failed')
  const successPatterns = successes.map(o => o.decisionTitle)
  const failurePatterns = failures.map(o => o.decisionTitle)
  const allLessons = outcomes.flatMap(o => o.lessonsLearned)
  return {
    totalDecisions: outcomes.length,
    successfulOutcomes: successes.length,
    failedOutcomes: failures.length,
    confidenceAdjustments: outcomes.reduce((s, o) => s + o.confidenceAdjustment, 0),
    recurringSuccesses: [...new Set(successPatterns)],
    recurringFailures: [...new Set(failurePatterns)],
    lessonsCount: allLessons.length,
    assessedAt: Date.now(),
  }
}
