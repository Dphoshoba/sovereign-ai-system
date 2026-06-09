import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DISABLED_RESPONSE = {
  ok: false,
  disabled: true,
  error:
    "Subtitle video rendering is disabled on Vercel because the function exceeds serverless size limits. Use a dedicated worker or external rendering service.",
}

export async function GET() {
  return NextResponse.json(DISABLED_RESPONSE, { status: 501 })
}

export async function POST() {
  return NextResponse.json(DISABLED_RESPONSE, { status: 501 })
}
