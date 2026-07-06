import type { ReviewRoadmapItem } from "./types"

export const REVIEW_SECTION_TITLES = {
  completed: "Completed",
  pending: "Pending",
  overdue: "Overdue",
  improvements: "Improvements",
  regressions: "Regressions",
  nextWeek: "Next Week",
  attention: "Attention Needed",
  debt: "Knowledge Debt",
  recommendations: "Recommendations",
  outlook: "Mission Outlook",
} as const

export function buildReviewRoadmap(slug: string): ReviewRoadmapItem[] {
  return [
    { date: "2026-07-03", event: `${slug} priorities executed for first weekly cycle`, status: "completed" },
    { date: "2026-07-04", event: `${slug} knowledge gaps reviewed`, status: "completed" },
    { date: "2026-07-05", event: `${slug} planner dependency health evaluated`, status: "in-progress" },
    { date: "2026-07-06", event: `${slug} weekly review summary generated`, status: "planned" },
  ]
}