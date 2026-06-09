import fs from "fs"
import path from "path"
import { google } from "googleapis"
import type { youtube_v3 } from "googleapis"

const credentialsPath = path.join(
  process.cwd(),
  "credentials",
  "youtube-oauth.json"
)

const tokenPath = path.join(
  process.cwd(),
  "credentials",
  "youtube-token.json"
)

export function getYouTubeCredentialsPath() {
  return credentialsPath
}

export function getYouTubeTokenPath() {
  return tokenPath
}

export function isYouTubeOAuthConfigured() {
  return (
    fs.existsSync(credentialsPath) && fs.existsSync(tokenPath)
  )
}

let cachedYoutube: youtube_v3.Youtube | null = null

export function getYouTubeClient(): youtube_v3.Youtube {
  if (!isYouTubeOAuthConfigured()) {
    throw new Error("YouTube OAuth credentials are not configured")
  }

  if (cachedYoutube) {
    return cachedYoutube
  }

  const credentials = JSON.parse(
    fs.readFileSync(credentialsPath, "utf8")
  )
  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf8"))
  const clientInfo = credentials.installed || credentials.web

  if (
    !clientInfo?.client_id ||
    !clientInfo?.client_secret ||
    !clientInfo?.redirect_uris?.[0]
  ) {
    throw new Error("YouTube OAuth credentials are not configured")
  }

  const oauth2Client = new google.auth.OAuth2(
    clientInfo.client_id,
    clientInfo.client_secret,
    clientInfo.redirect_uris[0]
  )

  oauth2Client.setCredentials(tokens)

  cachedYoutube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  })

  return cachedYoutube
}
