export const EXECUTIVE_LIST_LIMITS = {
  boardroomSessions: 25,
  planningCycles: 50,
  knowledgeGraphRecent: 10,
  decisions: 100,
  lessons: 100,
  strategyAdjustments: 50,
  scenarios: 50,
  quarterlyReviews: 20,
  executiveBriefings: 31,
} as const

export function summarizeStatusCounts<T extends string>(
  rows: { status: string; _count: { _all: number } }[],
  statuses: readonly T[]
) {
  const summary = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    T,
    number
  >

  for (const row of rows) {
    if (statuses.includes(row.status as T)) {
      summary[row.status as T] = row._count._all
    }
  }

  return summary
}
