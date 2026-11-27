/**
 * OAuth readiness inspection without exposing secrets.
 * Does not call Google and does not print token values.
 */

import fs from "node:fs"
import path from "node:path"

export type YouTubeOAuthReadiness = {
  configured: boolean
  credentialsFilePresent: boolean
  tokenFilePresent: boolean
  clientIdPresent: boolean
  clientSecretPresent: boolean
  redirectUriCount: number
  accessTokenPresent: boolean
  refreshTokenPresent: boolean
  expiryDatePresent: boolean
  scopeHasUpload: boolean
  scopeHasReadonly: boolean
  /** Wall-clock comparison only; does not call Google. */
  accessTokenLooksExpired: boolean | null
  credentialsPath: string
  tokenPath: string
}

function readJsonIfPresent(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
}

export function inspectYouTubeOAuthReadiness(
  cwd: string = process.cwd(),
): YouTubeOAuthReadiness {
  const credentialsPath = path.join(cwd, "credentials", "youtube-oauth.json")
  const tokenPath = path.join(cwd, "credentials", "youtube-token.json")

  const credentials = readJsonIfPresent(credentialsPath)
  const tokens = readJsonIfPresent(tokenPath)
  const clientInfo =
    (credentials?.installed as Record<string, unknown> | undefined) ||
    (credentials?.web as Record<string, unknown> | undefined) ||
    {}

  const scope = String(tokens?.scope || "")
  const expiry =
    typeof tokens?.expiry_date === "number" ? tokens.expiry_date : null

  return {
    configured: Boolean(credentials && tokens),
    credentialsFilePresent: Boolean(credentials),
    tokenFilePresent: Boolean(tokens),
    clientIdPresent: Boolean(clientInfo.client_id),
    clientSecretPresent: Boolean(clientInfo.client_secret),
    redirectUriCount: Array.isArray(clientInfo.redirect_uris)
      ? clientInfo.redirect_uris.length
      : 0,
    accessTokenPresent: Boolean(tokens?.access_token),
    refreshTokenPresent: Boolean(tokens?.refresh_token),
    expiryDatePresent: expiry !== null,
    scopeHasUpload: scope.includes("youtube.upload"),
    scopeHasReadonly: scope.includes("youtube.readonly"),
    accessTokenLooksExpired: expiry === null ? null : expiry <= Date.now(),
    credentialsPath,
    tokenPath,
  }
}
