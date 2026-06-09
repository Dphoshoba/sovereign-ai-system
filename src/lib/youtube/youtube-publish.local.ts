import fs from "fs"
import { google } from "googleapis"

export type YouTubePublishInput = {
  accessToken: string
  videoPath: string
  title: string
  description?: string
  tags?: string[]
  privacyStatus?: "private" | "unlisted" | "public"
}

/** Local/self-hosted only — do not import from Vercel API routes. */
export async function youtubePublishLocal(input: YouTubePublishInput) {
  const oauth2Client = new google.auth.OAuth2()

  oauth2Client.setCredentials({
    access_token: input.accessToken,
  })

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  })

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: input.title,
        description: input.description || "",
        tags: input.tags || [],
      },
      status: {
        privacyStatus: input.privacyStatus || "private",
      },
    },
    media: {
      body: fs.createReadStream(input.videoPath),
    },
  })

  return {
    videoId: response.data.id,
    youtubeUrl: response.data.id
      ? `https://youtube.com/watch?v=${response.data.id}`
      : null,
  }
}
