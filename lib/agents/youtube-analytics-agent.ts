import { google } from "googleapis"

type AnalyticsInput = {
  accessToken: string
  videoId: string
}

export async function youtubeAnalyticsAgent(input: AnalyticsInput) {
  const oauth2Client = new google.auth.OAuth2()

  oauth2Client.setCredentials({
    access_token: input.accessToken,
  })

  const youtubeAnalytics = google.youtubeAnalytics({
    version: "v2",
    auth: oauth2Client,
  })

  const response = await youtubeAnalytics.reports.query({
    ids: "channel==MINE",
    startDate: "2024-01-01",
    endDate: new Date().toISOString().split("T")[0],
    metrics:
      "views,estimatedMinutesWatched,averageViewDuration,likes,subscribersGained",
    dimensions: "video",
    filters: `video==${input.videoId}`,
  })

  return response.data
}
