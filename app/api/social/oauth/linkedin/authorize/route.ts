import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3000/api/auth/linkedin/callback"

  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "LinkedIn OAuth is not configured." },
      { status: 503 }
    )
  }

  const state = randomBytes(32).toString("hex")
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile w_member_social",
  })

  const response = NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  )
  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
