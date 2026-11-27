import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import {
  FACEBOOK_OAUTH_STATE_COOKIE,
  buildFacebookAuthorizeUrl,
  readFacebookEnv,
} from "../../../../../../lib/social/facebook-oauth"

/**
 * Facebook Login dialog for Page publishing permissions.
 * Requires FACEBOOK_APP_ID + FACEBOOK_REDIRECT_URI (exact Meta dashboard match).
 * Scopes: pages_show_list, pages_manage_posts, pages_read_engagement.
 */
export async function GET() {
  const env = readFacebookEnv()
  if (!env.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Facebook OAuth is not configured. Set ${env.missing.join(", ")}.`,
      },
      { status: 503 },
    )
  }

  const state = randomBytes(32).toString("hex")
  const authorizeUrl = buildFacebookAuthorizeUrl({
    appId: env.config.appId,
    redirectUri: env.config.redirectUri,
    state,
    graphVersion: env.config.graphVersion,
  })

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(FACEBOOK_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
