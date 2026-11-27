/**
 * Threads OAuth helpers recovered against Meta Threads API.
 * Pure request construction — no network I/O except where callers pass fetch.
 *
 * Official flow (Meta docs):
 * - Authorize: https://threads.net/oauth/authorize
 * - Token: POST https://graph.threads.net/oauth/access_token
 * - Long-lived: GET https://graph.threads.net/access_token?grant_type=th_exchange_token
 * - Profile: GET https://graph.threads.net/v1.0/me?fields=id,username,...
 * - Publish: POST /{user-id}/threads then /{user-id}/threads_publish
 */

export const THREADS_AUTHORIZE_URL = "https://threads.net/oauth/authorize"
export const THREADS_TOKEN_URL = "https://graph.threads.net/oauth/access_token"
export const THREADS_LONG_LIVED_TOKEN_URL =
  "https://graph.threads.net/access_token"
export const THREADS_GRAPH_BASE = "https://graph.threads.net/v1.0"
export const THREADS_OAUTH_STATE_COOKIE = "threads_oauth_state"
export const THREADS_INTEGRATION_NAME = "Threads"

/** Minimum scopes for identity + text publishing. */
export const THREADS_OAUTH_SCOPES = [
  "threads_basic",
  "threads_content_publish",
] as const

export type ThreadsEnvConfig = {
  appId: string
  appSecret: string
  redirectUri: string
}

export type ThreadsTokenExchangeResult = {
  accessToken: string
  userId: string
}

export type ThreadsLongLivedTokenResult = {
  accessToken: string
  tokenType?: string
  expiresIn?: number
}

export type ThreadsProfile = {
  id: string
  username?: string
}

export type ThreadsIntegrationConfig = {
  accessToken: string
  userId: string
  username?: string | null
  expiresAt?: string | null
  scopes?: string
  tokenType?: string | null
  providerStatus?: string
  shortLivedExchanged?: boolean
}

export function readThreadsEnv(
  env: NodeJS.ProcessEnv = process.env,
): { ok: true; config: ThreadsEnvConfig } | { ok: false; missing: string[] } {
  const appId = env.THREADS_APP_ID?.trim()
  const appSecret = env.THREADS_APP_SECRET?.trim()
  const redirectUri = env.THREADS_REDIRECT_URI?.trim()
  const missing: string[] = []
  if (!appId) missing.push("THREADS_APP_ID")
  if (!appSecret) missing.push("THREADS_APP_SECRET")
  if (!redirectUri) missing.push("THREADS_REDIRECT_URI")
  if (missing.length) return { ok: false, missing }
  return {
    ok: true,
    config: { appId: appId!, appSecret: appSecret!, redirectUri: redirectUri! },
  }
}

export function buildThreadsAuthorizeUrl(input: {
  appId: string
  redirectUri: string
  state: string
  scopes?: readonly string[]
}): string {
  const params = new URLSearchParams({
    client_id: input.appId,
    redirect_uri: input.redirectUri,
    scope: (input.scopes || THREADS_OAUTH_SCOPES).join(","),
    response_type: "code",
    state: input.state,
  })
  return `${THREADS_AUTHORIZE_URL}?${params.toString()}`
}

/** Meta may append `#_` to the redirected code; strip it. */
export function normalizeThreadsAuthCode(code: string): string {
  return code.replace(/#_+$/, "").trim()
}

export function validateThreadsOAuthState(input: {
  state: string | null | undefined
  cookieState: string | null | undefined
}): { ok: true } | { ok: false; error: string } {
  if (!input.state || !input.cookieState) {
    return { ok: false, error: "Invalid OAuth state parameter." }
  }
  if (input.state !== input.cookieState) {
    return { ok: false, error: "Invalid OAuth state parameter." }
  }
  return { ok: true }
}

export function buildThreadsTokenExchangeBody(input: {
  appId: string
  appSecret: string
  redirectUri: string
  code: string
}): URLSearchParams {
  return new URLSearchParams({
    client_id: input.appId,
    client_secret: input.appSecret,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
    code: normalizeThreadsAuthCode(input.code),
  })
}

export function buildThreadsLongLivedTokenUrl(input: {
  appSecret: string
  shortLivedAccessToken: string
}): string {
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: input.appSecret,
    access_token: input.shortLivedAccessToken,
  })
  return `${THREADS_LONG_LIVED_TOKEN_URL}?${params.toString()}`
}

export function buildThreadsRefreshLongLivedTokenUrl(input: {
  longLivedAccessToken: string
}): string {
  const params = new URLSearchParams({
    grant_type: "th_refresh_token",
    access_token: input.longLivedAccessToken,
  })
  return `${THREADS_LONG_LIVED_TOKEN_URL}?${params.toString()}`
}

export function buildThreadsProfileUrl(accessToken: string): string {
  const params = new URLSearchParams({
    fields: "id,username,threads_profile_picture_url,threads_biography",
    access_token: accessToken,
  })
  return `${THREADS_GRAPH_BASE}/me?${params.toString()}`
}

export function parseThreadsTokenExchangeResponse(
  data: Record<string, unknown>,
): ThreadsTokenExchangeResult | null {
  const accessToken =
    typeof data.access_token === "string" ? data.access_token : null
  const userId =
    typeof data.user_id === "string" || typeof data.user_id === "number"
      ? String(data.user_id)
      : null
  if (!accessToken || !userId) return null
  return { accessToken, userId }
}

export function parseThreadsLongLivedTokenResponse(
  data: Record<string, unknown>,
): ThreadsLongLivedTokenResult | null {
  const accessToken =
    typeof data.access_token === "string" ? data.access_token : null
  if (!accessToken) return null
  return {
    accessToken,
    tokenType: typeof data.token_type === "string" ? data.token_type : undefined,
    expiresIn:
      typeof data.expires_in === "number" ? data.expires_in : undefined,
  }
}

export function buildThreadsConnectionConfig(input: {
  accessToken: string
  userId: string
  username?: string | null
  expiresInSeconds?: number | null
  scopes?: string
  tokenType?: string | null
  shortLivedExchanged?: boolean
}): ThreadsIntegrationConfig {
  return {
    accessToken: input.accessToken,
    userId: input.userId,
    username: input.username ?? null,
    expiresAt:
      typeof input.expiresInSeconds === "number"
        ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
        : null,
    scopes: input.scopes || THREADS_OAUTH_SCOPES.join(","),
    tokenType: input.tokenType ?? "bearer",
    providerStatus: "connected",
    shortLivedExchanged: input.shortLivedExchanged ?? false,
  }
}

export function isThreadsTokenExpired(
  expiresAt: string | null | undefined,
): boolean {
  if (!expiresAt) return false
  const ts = new Date(expiresAt).getTime()
  if (Number.isNaN(ts)) return false
  return ts < Date.now()
}

export function inspectThreadsConnectionReadiness(input: {
  envConfigured: boolean
  integrationEnabled?: boolean
  config?: ThreadsIntegrationConfig | Record<string, unknown> | null
}): {
  connected: boolean
  status:
    | "not_configured"
    | "disconnected"
    | "token_expired"
    | "connected"
  userIdPresent: boolean
  usernamePresent: boolean
  accessTokenPresent: boolean
} {
  if (!input.envConfigured) {
    return {
      connected: false,
      status: "not_configured",
      userIdPresent: false,
      usernamePresent: false,
      accessTokenPresent: false,
    }
  }
  const config = (input.config || {}) as ThreadsIntegrationConfig
  const accessTokenPresent = Boolean(config.accessToken)
  const userIdPresent = Boolean(config.userId)
  const usernamePresent = Boolean(config.username)
  if (!input.integrationEnabled || !accessTokenPresent) {
    return {
      connected: false,
      status: "disconnected",
      userIdPresent,
      usernamePresent,
      accessTokenPresent,
    }
  }
  if (isThreadsTokenExpired(config.expiresAt)) {
    return {
      connected: false,
      status: "token_expired",
      userIdPresent,
      usernamePresent,
      accessTokenPresent,
    }
  }
  return {
    connected: true,
    status: "connected",
    userIdPresent,
    usernamePresent,
    accessTokenPresent,
  }
}
