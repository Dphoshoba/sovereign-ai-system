type AnalyticsInput = {
  title: string
  status: string
}

export function analyticsAgent(input: AnalyticsInput) {
  return {
    autonomousAnalyticsAgent: true,
    title: input.title,
    status: input.status,

    trackedMetrics: [
      "pageViews",
      "averageReadTime",
      "ctaClicks",
      "newsletterSignups",
      "returnVisitors",
      "searchImpressions",
    ],

    analyticsDirective:
      `Track performance insights for "${input.title}" after publication`,

    feedbackLoop:
      "Use analytics results to improve future research, content planning, SEO and publishing decisions.",

    nextStage:
      "Ready for execution workflow synthesis.",
  }
}
