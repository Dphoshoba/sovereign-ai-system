import fs from "fs"
import path from "path"
import { google } from "googleapis"

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

const credentials = JSON.parse(
  fs.readFileSync(credentialsPath, "utf8")
)

const tokens = JSON.parse(
  fs.readFileSync(tokenPath, "utf8")
)

const clientInfo =
  credentials.installed || credentials.web

const oauth2Client = new google.auth.OAuth2(
  clientInfo.client_id,
  clientInfo.client_secret,
  clientInfo.redirect_uris[0]
)

oauth2Client.setCredentials(tokens)

export const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
})
