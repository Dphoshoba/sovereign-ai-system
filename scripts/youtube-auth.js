// Local-only YouTube OAuth token regeneration.
// Regenerates credentials/youtube-token.json after invalid_grant (expired or
// revoked refresh token). Never deployed — Vercel YouTube routes stay disabled.
//
// Usage:
//   node scripts/youtube-auth.js               -> opens browser, captures code automatically
//   node scripts/youtube-auth.js --code <code> -> exchange a manually copied code
//   node scripts/youtube-auth.js --no-open     -> print URL only (don't launch browser)
//   node scripts/youtube-auth.js --verify      -> check saved token without re-consenting

const fs = require("fs")
const path = require("path")
const http = require("http")
const { exec } = require("child_process")
const { google } = require("googleapis")

const LOOPBACK_PORT = 53682

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

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
]

if (!fs.existsSync(credentialsPath)) {
  console.error(`Missing OAuth client file: ${credentialsPath}`)
  process.exit(1)
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
const clientInfo = credentials.installed || credentials.web

if (!clientInfo?.client_id || !clientInfo?.client_secret) {
  console.error("youtube-oauth.json is missing client_id/client_secret.")
  process.exit(1)
}

// Desktop ("installed") clients accept any localhost port at runtime, so we
// use a loopback redirect and capture the code without manual copy/paste.
const redirectUri = `http://localhost:${LOOPBACK_PORT}`

const oauth2Client = new google.auth.OAuth2(
  clientInfo.client_id,
  clientInfo.client_secret,
  redirectUri
)

// prompt=consent + access_type=offline forces Google to mint a NEW refresh
// token — required to recover from invalid_grant.
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
})

async function saveTokens(code) {
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    console.warn(
      "Warning: Google did not return a refresh_token. Revoke access at https://myaccount.google.com/permissions and run this script again."
    )
  }

  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2))

  console.log("\nYouTube token saved to:")
  console.log(tokenPath)
  console.log(
    `Scopes: ${tokens.scope ?? SCOPES.join(" ")}\nRefresh token: ${tokens.refresh_token ? "yes" : "NO"}`
  )
}

async function verifyToken() {
  if (!fs.existsSync(tokenPath)) {
    console.error(`✗ Token file not found: ${tokenPath}`)
    console.error("\nRun: node scripts/youtube-auth.js")
    process.exit(1)
  }

  console.log("✓ Token file found")

  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf8"))
  oauth2Client.setCredentials(tokens)

  try {
    const { token } = await oauth2Client.getAccessToken()

    if (!token) {
      throw new Error("No access token returned by OAuth refresh")
    }

    console.log("✓ OAuth refresh succeeded")
  } catch (error) {
    console.error(`✗ OAuth refresh failed: ${error.message}`)
    console.error("\nToken is invalid. Run: node scripts/youtube-auth.js")
    process.exit(1)
  }

  try {
    const youtube = google.youtube({ version: "v3", auth: oauth2Client })
    const response = await youtube.channels.list({
      part: ["snippet", "contentDetails"],
      mine: true,
    })

    const channel = response.data.items?.[0]

    if (!channel) {
      throw new Error("No channel found for this account")
    }

    console.log(`✓ YouTube channel connected: ${channel.snippet.title}`)
  } catch (error) {
    console.error(`✗ YouTube API call failed: ${error.message}`)
    console.error("\nToken is invalid. Run: node scripts/youtube-auth.js")
    process.exit(1)
  }

  const grantedScopes = (oauth2Client.credentials.scope ?? tokens.scope ?? "")
    .split(/\s+/)
    .filter(Boolean)

  if (grantedScopes.includes("https://www.googleapis.com/auth/youtube.upload")) {
    console.log("✓ Upload scope/token usable")
  } else {
    console.error(
      `✗ Upload scope missing. Granted scopes: ${grantedScopes.join(" ") || "(none recorded)"}`
    )
    console.error("\nRun: node scripts/youtube-auth.js")
    process.exit(1)
  }

  process.exit(0)
}

const codeArgIndex = process.argv.indexOf("--code")

if (process.argv.includes("--verify")) {
  verifyToken().catch((error) => {
    console.error(`✗ Verification failed: ${error.message}`)
    console.error("\nRun: node scripts/youtube-auth.js")
    process.exit(1)
  })
} else if (codeArgIndex !== -1 && process.argv[codeArgIndex + 1]) {
  // Manual fallback: exchange a copied code directly.
  saveTokens(process.argv[codeArgIndex + 1])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Token exchange failed:", error.message)
      process.exit(1)
    })
} else {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, redirectUri)
    const code = url.searchParams.get("code")
    const oauthError = url.searchParams.get("error")

    if (oauthError) {
      res.end(`OAuth error: ${oauthError}. You can close this tab.`)
      console.error(`OAuth error from Google: ${oauthError}`)
      server.close()
      process.exit(1)
    }

    if (!code) {
      res.end("Waiting for OAuth redirect with ?code=...")
      return
    }

    try {
      await saveTokens(code)
      res.end("YouTube reconnected. Token saved — you can close this tab.")
      server.close()
      process.exit(0)
    } catch (error) {
      res.end(`Token exchange failed: ${error.message}`)
      console.error("Token exchange failed:", error.message)
      server.close()
      process.exit(1)
    }
  })

  server.listen(LOOPBACK_PORT, () => {
    console.log("\nOpen this URL in your browser to reconnect YouTube:\n")
    console.log(authUrl)
    console.log(
      `\nListening on ${redirectUri} — the code will be captured automatically after you approve.\n`
    )

    if (!process.argv.includes("--no-open")) {
      exec(`start "" "${authUrl.replace(/&/g, "^&")}"`, () => {})
    }
  })

  server.on("error", (error) => {
    console.error(
      `Could not listen on port ${LOOPBACK_PORT}: ${error.message}\nRun again with: node scripts/youtube-auth.js --code <code>`
    )
    process.exit(1)
  })
}
