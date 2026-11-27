import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import {
  THREADS_OAUTH_STATE_COOKIE,
  buildThreadsAuthorizeUrl,
  readThreadsEnv,
} from "../../../../../../lib/social/threads-oauth"

/**
 * Threads 3-legged OAuth authorize (Meta Threads API).
 * Requires THREADS_APP_ID + THREADS_REDIRECT_URI (exact Meta dashboard match).
 * Scopes: threads_basic, threads_content_publish.
 */
export async function GET() {
  const env = readThreadsEnv()
  if (!env.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Threads OAuth is not configured. Set ${env.missing.join(", ")}.`,
      },
      { status: 503 },
    )
  }

  const state = randomBytes(32).toString("hex")
  const authorizeUrl = buildThreadsAuthorizeUrl({
    appId: env.config.appId,
    redirectUri: env.config.redirectUri,
    state,
  })

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(THREADS_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
