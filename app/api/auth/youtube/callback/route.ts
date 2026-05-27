import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Missing OAuth code" },
        { status: 400 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const { tokens } = await oauth2Client.getToken(code)

    return NextResponse.json({
      ok: true,
      message: "YouTube OAuth connected",
      tokens,
    })
  } catch (error) {
    console.error("YouTube OAuth callback failed:", error)

    return NextResponse.json(
      { ok: false, error: "YouTube OAuth callback failed" },
      { status: 500 }
    )
  }
}