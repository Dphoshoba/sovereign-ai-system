const fs = require("fs")
const path = require("path")
const { google } = require("googleapis")

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

const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"))

const clientInfo = credentials.installed || credentials.web

const oauth2Client = new google.auth.OAuth2(
  clientInfo.client_id,
  clientInfo.client_secret,
  clientInfo.redirect_uris[0]
)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/youtube.upload"],
})

console.log("\nOpen this URL in your browser:\n")
console.log(authUrl)

console.log("\nAfter approving, paste the code here.\n")

process.stdin.once("data", async (data) => {
  const code = data.toString().trim()

  const { tokens } = await oauth2Client.getToken(code)

  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2))

  console.log("\nYouTube token saved to:")
  console.log(tokenPath)
  process.exit(0)
})
