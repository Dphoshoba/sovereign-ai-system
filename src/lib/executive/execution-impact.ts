export const EXECUTION_STATUSES = [
  "planned",
  "active",
  "blocked",
  "completed",
  "proposed",
] as const

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number]

export const EXECUTION_PRIORITIES = ["low", "medium", "high", "urgent"] as const

export type ExecutionPriority = (typeof EXECUTION_PRIORITIES)[number]

export type ExecutionInitiativeRecord = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  ownerSystem: string | null
  source: string | null
  progress: number
  executionPath: unknown
  createdAt: Date
  updatedAt: Date
}

export type ExecutionImpact = {
  relatedProjects: {
    id: string
    title: string
    status: string
  }[]
  relatedTasks: {
    id: string
    title: string
    status: string
    projectId: string
  }[]
  activeInitiatives: {
    id: string
    title: string
    status: string
    progress: number
  }[]
}

function normalizeTitle(value: string) {
  return value.trim().toLowerCase()
}

function extractKeywords(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4)
}

function textMatchesKeywords(text: string, keywords: string[]) {
  if (keywords.length === 0) {
    return false
  }

  const haystack = text.toLowerCase()
  return keywords.some((keyword) => haystack.includes(keyword))
}

export function inferPriorityFromInitiative(title: string): ExecutionPriority {
  const normalized = title.toLowerCase()

  if (
    normalized.includes("urgent") ||
    normalized.includes("overdue") ||
    normalized.includes("revenue execution")
  ) {
    return "high"
  }

  if (
    normalized.includes("delivery") ||
    normalized.includes("content") ||
    normalized.includes("growth")
  ) {
    return "medium"
  }

  return "medium"
}

export function buildExecutionImpact(
  initiatives: ExecutionInitiativeRecord[],
  projects: { id: string; title: string; status: string }[],
  tasks: { id: string; title: string; status: string; projectId: string }[]
): ExecutionImpact {
  const activeInitiatives = initiatives
    .filter((item) => item.status === "active" || item.status === "planned")
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      progress: item.progress,
    }))

  const keywordPool = initiatives.flatMap((initiative) => {
    const actions = Array.isArray(initiative.executionPath)
      ? initiative.executionPath.filter(
          (action): action is string => typeof action === "string"
        )
      : []

    return [
      ...extractKeywords(initiative.title),
      ...actions.flatMap((action) => extractKeywords(action)),
    ]
  })

  const uniqueKeywords = [...new Set(keywordPool)]

  const relatedProjects = projects.filter(
    (project) =>
      project.status === "active" &&
      textMatchesKeywords(project.title, uniqueKeywords)
  )

  const relatedTasks = tasks.filter(
    (task) =>
      task.status !== "done" && textMatchesKeywords(task.title, uniqueKeywords)
  )

  return {
    relatedProjects: relatedProjects.slice(0, 10),
    relatedTasks: relatedTasks.slice(0, 10),
    activeInitiatives: activeInitiatives.slice(0, 10),
  }
}

export function normalizeInitiativeTitle(title: string) {
  return normalizeTitle(title)
}

export function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function isExecutionStatus(value: string): value is ExecutionStatus {
  return EXECUTION_STATUSES.includes(value as ExecutionStatus)
}

export function isExecutionPriority(
  value: string
): value is ExecutionPriority {
  return EXECUTION_PRIORITIES.includes(value as ExecutionPriority)
}
