import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  FACEBOOK_INTEGRATION_NAME,
  FACEBOOK_OAUTH_STATE_COOKIE,
  buildFacebookAccountsUrl,
  buildFacebookConnectionConfig,
  buildFacebookLongLivedUserTokenUrl,
  buildFacebookMeUrl,
  buildFacebookTokenExchangeUrl,
  parseFacebookPagesResponse,
  parseFacebookTokenResponse,
  readFacebookEnv,
  validateFacebookOAuthState,
} from "../../../../../../lib/social/facebook-oauth"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const errorReason = url.searchParams.get("error_reason")
  const cookieState = req.cookies.get(FACEBOOK_OAUTH_STATE_COOKIE)?.value

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `Facebook authorization denied: ${error}${errorReason ? ` (${errorReason})` : ""}`,
      },
      { status: 400 },
    )
  }

  const stateCheck = validateFacebookOAuthState({ state, cookieState })
  if (!stateCheck.ok) {
    return NextResponse.json(
      { ok: false, error: stateCheck.error },
      { status: 400 },
    )
  }

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Missing authorization code." },
      { status: 400 },
    )
  }

  const env = readFacebookEnv()
  if (!env.ok) {
    return NextResponse.json(
      { ok: false, error: "Facebook OAuth is not configured." },
      { status: 503 },
    )
  }

  try {
    const tokenResponse = await fetch(
      buildFacebookTokenExchangeUrl({
        appId: env.config.appId,
        appSecret: env.config.appSecret,
        redirectUri: env.config.redirectUri,
        code,
        graphVersion: env.config.graphVersion,
      }),
      { method: "GET" },
    )
    const tokenData = (await tokenResponse.json()) as Record<string, unknown>
    const shortLived = parseFacebookTokenResponse(tokenData)

    if (!tokenResponse.ok || !shortLived) {
      return NextResponse.json(
        {
          ok: false,
          error:
            (typeof (tokenData.error as { message?: string } | undefined)
              ?.message === "string" &&
              (tokenData.error as { message: string }).message) ||
            "Token exchange failed",
        },
        { status: 400 },
      )
    }

    let userAccessToken = shortLived.accessToken
    let expiresInSeconds: number | null = shortLived.expiresIn ?? 3600

    try {
      const longLivedResponse = await fetch(
        buildFacebookLongLivedUserTokenUrl({
          appId: env.config.appId,
          appSecret: env.config.appSecret,
          shortLivedUserToken: shortLived.accessToken,
          graphVersion: env.config.graphVersion,
        }),
        { method: "GET" },
      )
      const longLivedData = (await longLivedResponse.json()) as Record<
        string,
        unknown
      >
      const longLived = parseFacebookTokenResponse(longLivedData)
      if (longLivedResponse.ok && longLived) {
        userAccessToken = longLived.accessToken
        expiresInSeconds = longLived.expiresIn ?? 60 * 60 * 24 * 60
      }
    } catch {
      // Keep short-lived user token if exchange fails.
    }

    const meResponse = await fetch(
      buildFacebookMeUrl({
        accessToken: userAccessToken,
        graphVersion: env.config.graphVersion,
      }),
      { method: "GET" },
    )
    const meData = (await meResponse.json()) as Record<string, unknown>
    const userId = typeof meData.id === "string" ? meData.id : null
    if (!meResponse.ok || !userId) {
      return NextResponse.json(
        { ok: false, error: "Unable to resolve Facebook user identity." },
        { status: 400 },
      )
    }

    const accountsResponse = await fetch(
      buildFacebookAccountsUrl({
        userId,
        accessToken: userAccessToken,
        graphVersion: env.config.graphVersion,
      }),
      { method: "GET" },
    )
    const accountsData = (await accountsResponse.json()) as Record<
      string,
      unknown
    >
    const availablePages = accountsResponse.ok
      ? parseFacebookPagesResponse(accountsData)
      : []

    const connectionData = buildFacebookConnectionConfig({
      userAccessToken,
      userId,
      availablePages,
      expiresInSeconds,
    })

    await prisma.externalIntegration.upsert({
      where: { name: FACEBOOK_INTEGRATION_NAME },
      update: {
        enabled: true,
        status: "connected_pending_page_selection",
        config: connectionData,
        lastChecked: new Date(),
        lastError: null,
      },
      create: {
        name: FACEBOOK_INTEGRATION_NAME,
        provider: "facebook",
        category: "social",
        enabled: true,
        status: "connected_pending_page_selection",
        config: connectionData,
      },
    })

    const response = NextResponse.json({
      ok: true,
      userId,
      availablePageCount: availablePages.length,
      pages: availablePages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        tasks: p.tasks,
      })),
      nextStep:
        availablePages.length === 0
          ? "No Pages returned. Confirm Page roles and permissions."
          : "Select an authorised Page via POST /api/social/oauth/facebook/select-page",
      // Never return access tokens.
    })
    response.cookies.delete(FACEBOOK_OAUTH_STATE_COOKIE)
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
