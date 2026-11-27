/**
 * Director Checklist operational monitoring overlay.
 *
 * Derives Success / Pending / Failed / Blocked / Unavailable / Unknown from
 * existing checklist evidence plus optional OperationalEvent / social-status
 * signals. Read-only. Does not invent completion or create a parallel workflow.
 */
import {
  buildDirectorChecklist,
  type DirectorChecklist,
  type DirectorChecklistArticle,
  type DirectorChecklistStep,
  type DirectorChecklistStepId,
  type DirectorChecklistStepState,
} from "./director-checklist"

export const DIRECTOR_MONITORING_STATUSES = [
  "Success",
  "Pending",
  "Failed",
  "Blocked",
  "Unavailable",
  "Unknown",
] as const

export type DirectorMonitoringStatus =
  (typeof DIRECTOR_MONITORING_STATUSES)[number]

export type DirectorOperationalSignal = {
  type: string
  source: string
  entityType?: string | null
  entityId?: string | null
  severity?: string | null
  message?: string | null
  createdAt?: Date | string | null
  payload?: unknown
}

export type DirectorMonitoredStep = DirectorChecklistStep & {
  monitoringStatus: DirectorMonitoringStatus
  monitoringDetail: string
  evidenceBasis: string[]
}

export type DirectorMonitoringView = {
  articleId: string
  title: string
  slug: string
  articleStatus: string
  steps: DirectorMonitoredStep[]
  nextAction: DirectorMonitoredStep | null
  summary: Record<DirectorMonitoringStatus, number>
  /** Explicit: this view never mutates publishing state. */
  readOnly: true
}

const STATE_TO_MONITORING: Record<
  DirectorChecklistStepState,
  DirectorMonitoringStatus
> = {
  complete: "Success",
  action_required: "Pending",
  blocked: "Blocked",
  not_started: "Pending",
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function signalTime(signal: DirectorOperationalSignal): number {
  const raw = iso(signal.createdAt)
  if (!raw) return 0
  const time = Date.parse(raw)
  return Number.isFinite(time) ? time : 0
}

function latestSignal(
  signals: DirectorOperationalSignal[],
  predicate: (signal: DirectorOperationalSignal) => boolean,
): DirectorOperationalSignal | null {
  const matches = signals.filter(predicate).sort((a, b) => signalTime(b) - signalTime(a))
  return matches[0] ?? null
}

function baseMonitoring(step: DirectorChecklistStep): {
  monitoringStatus: DirectorMonitoringStatus
  monitoringDetail: string
  evidenceBasis: string[]
} {
  const monitoringStatus = STATE_TO_MONITORING[step.state]
  const evidenceBasis = [
    `checklist.state:${step.state}`,
    ...Object.entries(step.evidence)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${String(value)}`),
  ]
  const monitoringDetail =
    step.state === "not_started"
      ? `${step.detail} (monitoring: Pending — not started).`
      : step.detail
  return { monitoringStatus, monitoringDetail, evidenceBasis }
}

function applyArticleStatusOverrides(
  step: DirectorChecklistStep,
  articleStatus: string,
  current: {
    monitoringStatus: DirectorMonitoringStatus
    monitoringDetail: string
    evidenceBasis: string[]
  },
): {
  monitoringStatus: DirectorMonitoringStatus
  monitoringDetail: string
  evidenceBasis: string[]
} {
  if (articleStatus === "rejected" && step.id === "human_approval") {
    return {
      monitoringStatus: "Failed",
      monitoringDetail: "Article status is rejected.",
      evidenceBasis: [...current.evidenceBasis, "articleStatus:rejected"],
    }
  }
  if (
    articleStatus === "archived" &&
    (step.id === "human_approval" ||
      step.id === "publication" ||
      step.id === "featured_image" ||
      step.id === "social_distribution")
  ) {
    return {
      monitoringStatus: "Unavailable",
      monitoringDetail: "Article is archived; this stage is no longer operable.",
      evidenceBasis: [...current.evidenceBasis, "articleStatus:archived"],
    }
  }
  return current
}

function applySocialSignals(
  step: DirectorChecklistStep,
  article: DirectorChecklistArticle,
  signals: DirectorOperationalSignal[],
  current: {
    monitoringStatus: DirectorMonitoringStatus
    monitoringDetail: string
    evidenceBasis: string[]
  },
): {
  monitoringStatus: DirectorMonitoringStatus
  monitoringDetail: string
  evidenceBasis: string[]
} {
  if (step.id !== "social_distribution") return current

  const socialIds = new Set(article.socialPosts.map((post) => post.id))
  const related = signals.filter(
    (signal) =>
      signal.entityType === "SocialPost" &&
      typeof signal.entityId === "string" &&
      socialIds.has(signal.entityId),
  )

  const publishing = article.socialPosts.filter(
    (post) => post.status === "publishing",
  )
  if (publishing.length > 0) {
    return {
      monitoringStatus: "Pending",
      monitoringDetail:
        "X/Twitter publish claim is in progress (status publishing). Do not retry automatically.",
      evidenceBasis: [
        ...current.evidenceBasis,
        `socialStatus:publishing:${publishing.length}`,
      ],
    }
  }

  const failed = latestSignal(
    related,
    (signal) => signal.type === "social_publish_failed",
  )
  const uncertain = latestSignal(
    related,
    (signal) => signal.type === "social_publish_uncertain",
  )
  const succeeded = latestSignal(
    related,
    (signal) => signal.type === "social_publish",
  )

  // Prefer the newest decisive social outcome signal.
  const newest = [failed, uncertain, succeeded]
    .filter((signal): signal is DirectorOperationalSignal => Boolean(signal))
    .sort((a, b) => signalTime(b) - signalTime(a))[0]

  if (newest?.type === "social_publish_uncertain") {
    return {
      monitoringStatus: "Unknown",
      monitoringDetail:
        newest.message?.trim() ||
        "X publish outcome is uncertain. Review the operational event before any further attempt.",
      evidenceBasis: [
        ...current.evidenceBasis,
        `operationalEvent:${newest.type}`,
        `operationalEventIdSource:${newest.source}`,
      ],
    }
  }

  if (newest?.type === "social_publish_failed") {
    return {
      monitoringStatus: "Failed",
      monitoringDetail:
        newest.message?.trim() || "Social publish failed (operational event).",
      evidenceBasis: [
        ...current.evidenceBasis,
        `operationalEvent:${newest.type}`,
        `operationalEventIdSource:${newest.source}`,
      ],
    }
  }

  if (current.monitoringStatus === "Success" && succeeded) {
    return {
      ...current,
      evidenceBasis: [
        ...current.evidenceBasis,
        `operationalEvent:${succeeded.type}`,
      ],
    }
  }

  return current
}

/**
 * Map one checklist step to an operational monitoring status using only
 * provided article + operational evidence.
 */
export function monitorDirectorChecklistStep(
  step: DirectorChecklistStep,
  article: DirectorChecklistArticle,
  signals: DirectorOperationalSignal[] = [],
): DirectorMonitoredStep {
  let monitored = baseMonitoring(step)
  monitored = applyArticleStatusOverrides(step, article.status, monitored)
  monitored = applySocialSignals(step, article, signals, monitored)
  return {
    ...step,
    ...monitored,
  }
}

export function summarizeMonitoring(
  steps: DirectorMonitoredStep[],
): Record<DirectorMonitoringStatus, number> {
  const summary: Record<DirectorMonitoringStatus, number> = {
    Success: 0,
    Pending: 0,
    Failed: 0,
    Blocked: 0,
    Unavailable: 0,
    Unknown: 0,
  }
  for (const step of steps) {
    summary[step.monitoringStatus] += 1
  }
  return summary
}

/**
 * Build the Director monitoring view on top of the existing checklist.
 * Does not create workflow records or mutate article/social state.
 */
export function buildDirectorMonitoringView(
  article: DirectorChecklistArticle,
  signals: DirectorOperationalSignal[] = [],
): DirectorMonitoringView {
  const checklist = buildDirectorChecklist(article)
  return attachDirectorMonitoring(checklist, article, signals)
}

export function attachDirectorMonitoring(
  checklist: DirectorChecklist,
  article: DirectorChecklistArticle,
  signals: DirectorOperationalSignal[] = [],
): DirectorMonitoringView {
  const steps = checklist.steps.map((step) =>
    monitorDirectorChecklistStep(step, article, signals),
  )
  const nextAction =
    steps.find(
      (step) =>
        step.monitoringStatus === "Pending" ||
        step.monitoringStatus === "Blocked" ||
        step.monitoringStatus === "Failed" ||
        step.monitoringStatus === "Unknown",
    ) ?? null

  return {
    articleId: checklist.articleId,
    title: checklist.title,
    slug: checklist.slug,
    articleStatus: checklist.articleStatus,
    steps,
    nextAction,
    summary: summarizeMonitoring(steps),
    readOnly: true,
  }
}

export function monitoringStatusForStepId(
  view: DirectorMonitoringView,
  stepId: DirectorChecklistStepId,
): DirectorMonitoringStatus | null {
  return view.steps.find((step) => step.id === stepId)?.monitoringStatus ?? null
}
