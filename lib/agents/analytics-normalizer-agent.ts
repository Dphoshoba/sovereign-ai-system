type YouTubeAnalyticsResult = {
  columnHeaders?:
    | {
        name?: string | null
        columnType?: string | null
        dataType?: string | null
      }[]
    | null
  rows?: any[][] | null
}

export function analyticsNormalizerAgent(result: YouTubeAnalyticsResult) {
  const headers = result.columnHeaders || []
  const rows = result.rows || []

  if (!rows.length) {
    return {
      hasData: false,
      message: "No analytics rows available yet.",
      metrics: {
        videoId: null,
        views: 0,
        estimatedMinutesWatched: 0,
        averageViewDuration: 0,
        likes: 0,
        subscribersGained: 0,
      },
      reinforcementInput: null,
    }
  }

  const firstRow = rows[0]

  const getValue = (name: string) => {
    const index = headers.findIndex((h) => h.name === name)
    return index >= 0 ? firstRow[index] : 0
  }

  const metrics = {
    videoId: getValue("video"),
    views: Number(getValue("views") || 0),
    estimatedMinutesWatched: Number(getValue("estimatedMinutesWatched") || 0),
    averageViewDuration: Number(getValue("averageViewDuration") || 0),
    likes: Number(getValue("likes") || 0),
    subscribersGained: Number(getValue("subscribersGained") || 0),
  }

  return {
    hasData: true,
    metrics,
    reinforcementInput: {
      ctr: 0,
      retention: 0,
      avgWatchTime: metrics.averageViewDuration,
      views: metrics.views,
      subscribersGained: metrics.subscribersGained,
    },
  }
}