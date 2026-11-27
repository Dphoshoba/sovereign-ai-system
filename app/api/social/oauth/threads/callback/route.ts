import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  THREADS_INTEGRATION_NAME,
  THREADS_OAUTH_STATE_COOKIE,
  THREADS_TOKEN_URL,
  buildThreadsConnectionConfig,
  buildThreadsLongLivedTokenUrl,
  buildThreadsProfileUrl,
  buildThreadsTokenExchangeBody,
  normalizeThreadsAuthCode,
  parseThreadsLongLivedTokenResponse,
  parseThreadsTokenExchangeResponse,
  readThreadsEnv,
  validateThreadsOAuthState,
} from "../../../../../../lib/social/threads-oauth"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const codeRaw = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const cookieState = req.cookies.get(THREADS_OAUTH_STATE_COOKIE)?.value

  if (error) {
    return NextResponse.json(
      { ok: false, error: `Threads authorization denied: ${error}` },
      { status: 400 },
    )
  }

  const stateCheck = validateThreadsOAuthState({ state, cookieState })
  if (!stateCheck.ok) {
    return NextResponse.json(
      { ok: false, error: stateCheck.error },
      { status: 400 },
    )
  }

  if (!codeRaw) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization code." },
      { status: 400 },
    )
  }

  const env = readThreadsEnv()
  if (!env.ok) {
    return NextResponse.json(
      { ok: false, error: "Threads OAuth is not configured." },
      { status: 503 },
    )
  }

  const code = normalizeThreadsAuthCode(codeRaw)

  try {
    const tokenResponse = await fetch(THREADS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildThreadsTokenExchangeBody({
        appId: env.config.appId,
        appSecret: env.config.appSecret,
        redirectUri: env.config.redirectUri,
        code,
      }),
    })

    const tokenData = (await tokenResponse.json()) as Record<string, unknown>
    const shortLived = parseThreadsTokenExchangeResponse(tokenData)

    if (!tokenResponse.ok || !shortLived) {
      return NextResponse.json(
        {
          ok: false,
          error:
            (typeof tokenData.error_message === "string" &&
              tokenData.error_message) ||
            (typeof tokenData.error === "string" && tokenData.error) ||
            "Token exchange failed",
        },
        { status: 400 },
      )
    }

    let accessToken = shortLived.accessToken
    let expiresInSeconds: number | null = 3600
    let shortLivedExchanged = false
    let tokenType: string | null = "bearer"

    try {
      const longLivedUrl = buildThreadsLongLivedTokenUrl({
        appSecret: env.config.appSecret,
        shortLivedAccessToken: shortLived.accessToken,
      })
      const longLivedResponse = await fetch(longLivedUrl, { method: "GET" })
      const longLivedData = (await longLivedResponse.json()) as Record<
        string,
        unknown
      >
      const longLived = parseThreadsLongLivedTokenResponse(longLivedData)
      if (longLivedResponse.ok && longLived) {
        accessToken = longLived.accessToken
        expiresInSeconds = longLived.expiresIn ?? 60 * 60 * 24 * 60
        tokenType = longLived.tokenType ?? "bearer"
        shortLivedExchanged = true
      }
    } catch {
      // Keep short-lived token if exchange fails; publish will require re-auth later.
    }

    let username: string | null = null
    try {
      const profileResponse = await fetch(
        buildThreadsProfileUrl(accessToken),
        { method: "GET" },
      )
      if (profileResponse.ok) {
        const profile = (await profileResponse.json()) as Record<string, unknown>
        if (typeof profile.username === "string") {
          username = profile.username
        }
      }
    } catch {
      // Username optional for publish; public URL may be null.
    }

    const connectionData = buildThreadsConnectionConfig({
      accessToken,
      userId: shortLived.userId,
      username,
      expiresInSeconds,
      tokenType,
      shortLivedExchanged,
    })

    await prisma.externalIntegration.upsert({
      where: { name: THREADS_INTEGRATION_NAME },
      update: {
        enabled: true,
        status: "connected",
        config: connectionData,
        lastChecked: new Date(),
        lastError: null,
      },
      create: {
        name: THREADS_INTEGRATION_NAME,
        provider: "threads",
        category: "social",
        enabled: true,
        status: "connected",
        config: connectionData,
      },
    })

    const response = NextResponse.json({
      ok: true,
      userId: shortLived.userId,
      username,
      scopes: connectionData.scopes,
      shortLivedExchanged,
      // Never return access tokens to the client.
    })
    response.cookies.delete(THREADS_OAUTH_STATE_COOKIE)
    return response
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "OAuth callback failed",
      },
      { status: 500 },
    )
  }
}
