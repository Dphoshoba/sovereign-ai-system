/**
 * Facebook Page OAuth helpers recovered against Meta Graph API / Facebook Login.
 * Pure request construction — callers supply fetch for network I/O.
 *
 * Official flow (Meta docs):
 * - Dialog: https://www.facebook.com/{version}/dialog/oauth
 * - Token: GET https://graph.facebook.com/{version}/oauth/access_token
 * - Long-lived user: grant_type=fb_exchange_token
 * - Pages: GET /{user-id}/accounts → Page id + page access_token
 * - Publish: POST /{page-id}/feed with Page access token
 *
 * Target: Facebook Page publishing only (not personal profile).
 */

export const FACEBOOK_INTEGRATION_NAME = "Facebook"
export const FACEBOOK_OAUTH_STATE_COOKIE = "facebook_oauth_state"
/** Current Graph API (Nov 2026). v21.0 retires 21 Jan 2027 — do not activate on v21. */
export const DEFAULT_FACEBOOK_GRAPH_VERSION = "v27.0"

/** Minimum permissions for Page list + Page feed publishing. */
export const FACEBOOK_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
] as const

export type FacebookEnvConfig = {
  appId: string
  appSecret: string
  redirectUri: string
  graphVersion: string
}

export type FacebookPageCandidate = {
  id: string
  name: string
  category?: string | null
  tasks: string[]
  /** Page access token — never expose via status APIs. */
  accessToken: string
}

export type FacebookIntegrationConfig = {
  userAccessToken?: string | null
  userId?: string | null
  expiresAt?: string | null
  scopes?: string
  providerStatus?: string
  availablePages?: FacebookPageCandidate[]
  /** Explicitly selected authorised Page. */
  pageId?: string | null
  pageName?: string | null
  pageAccessToken?: string | null
  pageSelectedAt?: string | null
  pageTasks?: string[]
}

export function readFacebookEnv(
  env: NodeJS.ProcessEnv = process.env,
): { ok: true; config: FacebookEnvConfig } | { ok: false; missing: string[] } {
  const appId = env.FACEBOOK_APP_ID?.trim()
  const appSecret = env.FACEBOOK_APP_SECRET?.trim()
  const redirectUri = env.FACEBOOK_REDIRECT_URI?.trim()
  const missing: string[] = []
  if (!appId) missing.push("FACEBOOK_APP_ID")
  if (!appSecret) missing.push("FACEBOOK_APP_SECRET")
  if (!redirectUri) missing.push("FACEBOOK_REDIRECT_URI")
  if (missing.length) return { ok: false, missing }
  return {
    ok: true,
    config: {
      appId: appId!,
      appSecret: appSecret!,
      redirectUri: redirectUri!,
      graphVersion:
        env.FACEBOOK_GRAPH_API_VERSION?.trim() || DEFAULT_FACEBOOK_GRAPH_VERSION,
    },
  }
}

export function facebookGraphBase(version: string = DEFAULT_FACEBOOK_GRAPH_VERSION) {
  return `https://graph.facebook.com/${version}`
}

export function buildFacebookAuthorizeUrl(input: {
  appId: string
  redirectUri: string
  state: string
  graphVersion?: string
  scopes?: readonly string[]
}): string {
  const version = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION
  const params = new URLSearchParams({
    client_id: input.appId,
    redirect_uri: input.redirectUri,
    state: input.state,
    response_type: "code",
    scope: (input.scopes || FACEBOOK_OAUTH_SCOPES).join(","),
  })
  return `https://www.facebook.com/${version}/dialog/oauth?${params.toString()}`
}

export function validateFacebookOAuthState(input: {
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

export function buildFacebookTokenExchangeUrl(input: {
  appId: string
  appSecret: string
  redirectUri: string
  code: string
  graphVersion?: string
}): string {
  const version = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION
  const params = new URLSearchParams({
    client_id: input.appId,
    client_secret: input.appSecret,
    redirect_uri: input.redirectUri,
    code: input.code.trim(),
  })
  return `${facebookGraphBase(version)}/oauth/access_token?${params.toString()}`
}

export function buildFacebookLongLivedUserTokenUrl(input: {
  appId: string
  appSecret: string
  shortLivedUserToken: string
  graphVersion?: string
}): string {
  const version = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: input.appId,
    client_secret: input.appSecret,
    fb_exchange_token: input.shortLivedUserToken,
  })
  return `${facebookGraphBase(version)}/oauth/access_token?${params.toString()}`
}

export function buildFacebookMeUrl(input: {
  accessToken: string
  graphVersion?: string
}): string {
  const version = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION
  const params = new URLSearchParams({
    fields: "id,name",
    access_token: input.accessToken,
  })
  return `${facebookGraphBase(version)}/me?${params.toString()}`
}

export function buildFacebookAccountsUrl(input: {
  userId: string
  accessToken: string
  graphVersion?: string
}): string {
  const version = input.graphVersion || DEFAULT_FACEBOOK_GRAPH_VERSION
  const params = new URLSearchParams({
    fields: "id,name,category,tasks,access_token",
    access_token: input.accessToken,
  })
  return `${facebookGraphBase(version)}/${input.userId}/accounts?${params.toString()}`
}

export function parseFacebookTokenResponse(
  data: Record<string, unknown>,
): { accessToken: string; expiresIn?: number; tokenType?: string } | null {
  const accessToken =
    typeof data.access_token === "string" ? data.access_token : null
  if (!accessToken) return null
  return {
    accessToken,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : undefined,
    tokenType: typeof data.token_type === "string" ? data.token_type : undefined,
  }
}

export function parseFacebookPagesResponse(
  data: Record<string, unknown>,
): FacebookPageCandidate[] {
  const rows = Array.isArray(data.data) ? data.data : []
  const pages: FacebookPageCandidate[] = []
  for (const row of rows) {
    if (!row || typeof row !== "object") continue
    const item = row as Record<string, unknown>
    const id = typeof item.id === "string" ? item.id : null
    const name = typeof item.name === "string" ? item.name : null
    const accessToken =
      typeof item.access_token === "string" ? item.access_token : null
    if (!id || !name || !accessToken) continue
    const tasks = Array.isArray(item.tasks)
      ? item.tasks.filter((t): t is string => typeof t === "string")
      : []
    pages.push({
      id,
      name,
      category: typeof item.category === "string" ? item.category : null,
      tasks,
      accessToken,
    })
  }
  return pages
}

export function pageAllowsContentCreation(page: FacebookPageCandidate): boolean {
  return page.tasks.includes("CREATE_CONTENT") || page.tasks.includes("MANAGE")
}

/**
 * Explicit Page selection — rejects unknown / unauthorised Page ids.
 * Never auto-selects when multiple pages exist.
 */
export function selectAuthorisedFacebookPage(input: {
  availablePages: FacebookPageCandidate[]
  pageId: string
}):
  | { ok: true; page: FacebookPageCandidate }
  | { ok: false; error: string; code: "page_not_found" | "page_lacks_create_content" } {
  const page = input.availablePages.find((p) => p.id === input.pageId)
  if (!page) {
    return {
      ok: false,
      code: "page_not_found",
      error: "Requested Facebook Page is not in the authorised accounts list.",
    }
  }
  if (!pageAllowsContentCreation(page)) {
    return {
      ok: false,
      code: "page_lacks_create_content",
      error:
        "Selected Facebook Page does not grant CREATE_CONTENT (or MANAGE) task.",
    }
  }
  return { ok: true, page }
}

export function buildFacebookConnectionConfig(input: {
  userAccessToken: string
  userId: string
  availablePages: FacebookPageCandidate[]
  expiresInSeconds?: number | null
  scopes?: string
}): FacebookIntegrationConfig {
  return {
    userAccessToken: input.userAccessToken,
    userId: input.userId,
    expiresAt:
      typeof input.expiresInSeconds === "number"
        ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
        : null,
    scopes: input.scopes || FACEBOOK_OAUTH_SCOPES.join(","),
    providerStatus: "connected_pending_page_selection",
    availablePages: input.availablePages,
    pageId: null,
    pageName: null,
    pageAccessToken: null,
    pageSelectedAt: null,
    pageTasks: [],
  }
}

export function applyFacebookPageSelection(
  config: FacebookIntegrationConfig,
  page: FacebookPageCandidate,
  now: Date = new Date(),
): FacebookIntegrationConfig {
  return {
    ...config,
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.accessToken,
    pageSelectedAt: now.toISOString(),
    pageTasks: page.tasks,
    providerStatus: "connected",
  }
}

export function isFacebookTokenExpired(
  expiresAt: string | null | undefined,
): boolean {
  if (!expiresAt) return false
  const ts = new Date(expiresAt).getTime()
  if (Number.isNaN(ts)) return false
  return ts < Date.now()
}

export function inspectFacebookConnectionReadiness(input: {
  envConfigured: boolean
  integrationEnabled?: boolean
  config?: FacebookIntegrationConfig | Record<string, unknown> | null
}): {
  connected: boolean
  status:
    | "not_configured"
    | "disconnected"
    | "token_expired"
    | "pending_page_selection"
    | "connected"
  userIdPresent: boolean
  pageSelected: boolean
  availablePageCount: number
  pageIdPresent: boolean
  pageAccessTokenPresent: boolean
} {
  if (!input.envConfigured) {
    return {
      connected: false,
      status: "not_configured",
      userIdPresent: false,
      pageSelected: false,
      availablePageCount: 0,
      pageIdPresent: false,
      pageAccessTokenPresent: false,
    }
  }
  const config = (input.config || {}) as FacebookIntegrationConfig
  const availablePageCount = Array.isArray(config.availablePages)
    ? config.availablePages.length
    : 0
  const userIdPresent = Boolean(config.userId)
  const pageIdPresent = Boolean(config.pageId)
  const pageAccessTokenPresent = Boolean(config.pageAccessToken)
  const pageSelected = pageIdPresent && pageAccessTokenPresent

  if (!input.integrationEnabled || !config.userAccessToken) {
    return {
      connected: false,
      status: "disconnected",
      userIdPresent,
      pageSelected,
      availablePageCount,
      pageIdPresent,
      pageAccessTokenPresent,
    }
  }
  if (isFacebookTokenExpired(config.expiresAt)) {
    return {
      connected: false,
      status: "token_expired",
      userIdPresent,
      pageSelected,
      availablePageCount,
      pageIdPresent,
      pageAccessTokenPresent,
    }
  }
  if (!pageSelected) {
    return {
      connected: false,
      status: "pending_page_selection",
      userIdPresent,
      pageSelected: false,
      availablePageCount,
      pageIdPresent,
      pageAccessTokenPresent,
    }
  }
  return {
    connected: true,
    status: "connected",
    userIdPresent,
    pageSelected: true,
    availablePageCount,
    pageIdPresent,
    pageAccessTokenPresent,
  }
}

/** Safe page summary for status APIs — no tokens. */
export function summariseFacebookPages(
  pages: FacebookPageCandidate[] | undefined,
): Array<{ id: string; name: string; category?: string | null; tasks: string[] }> {
  if (!Array.isArray(pages)) return []
  return pages.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    tasks: p.tasks,
  }))
}
