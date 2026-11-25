import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const cookieState = req.cookies.get("linkedin_oauth_state")?.value

  if (error) {
    return NextResponse.json(
      { ok: false, error: `LinkedIn authorization denied: ${error}` },
      { status: 400 }
    )
  }

  if (!state || state !== cookieState) {
    return NextResponse.json(
      { ok: false, error: "Invalid OAuth state parameter." },
      { status: 400 }
    )
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization code." },
      { status: 400 }
    )
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: "LinkedIn OAuth is not configured." },
      { status: 503 }
    )
  }

  try {
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      }
    )

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json(
        { ok: false, error: tokenData.error_description || "Token exchange failed" },
        { status: 400 }
      )
    }

    let memberUrn: string | null = null
    let memberName: string | null = null

    try {
      const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        memberUrn = profile.sub ? `urn:li:person:${profile.sub}` : null
        memberName = profile.name || null
      }
    } catch {
      // OpenID Connect product not enabled — identity unavailable
    }

    if (!memberUrn) {
      try {
        const meResponse = await fetch("https://api.linkedin.com/v2/me", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        })
        if (meResponse.ok) {
          const meData = await meResponse.json()
          memberUrn = meData.id ? `urn:li:person:${meData.id}` : null
          memberName = `${meData.localizedFirstName || ""} ${meData.localizedLastName || ""}`.trim() || null
        }
      } catch {
        // /v2/me unavailable
      }
    }

    const connectionData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      expiresAt: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      scopes: tokenData.scope || "w_member_social",
      memberUrn,
      memberName,
      providerStatus: "connected",
      openIdEnabled: !!memberUrn,
    }

    await prisma.externalIntegration.upsert({
      where: { name: "LinkedIn" },
      update: {
        enabled: true,
        status: "connected",
        config: connectionData,
        lastChecked: new Date(),
        lastError: null,
      },
      create: {
        name: "LinkedIn",
        provider: "linkedin",
        category: "social",
        enabled: true,
        status: "connected",
        config: connectionData,
      },
    })

    const response = NextResponse.json({
      ok: true,
      memberUrn: connectionData.memberUrn,
      memberName: connectionData.memberName,
      scopes: tokenData.scope,
    })
    response.cookies.delete("linkedin_oauth_state")
    return response
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "OAuth callback failed" },
      { status: 500 }
    )
  }
}
