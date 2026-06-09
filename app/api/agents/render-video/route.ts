import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const DISABLED_RESPONSE = {
  ok: false,
  disabled: true,
  error:
    "Video rendering is disabled on Vercel because this route exceeds the serverless function size limit. Use a dedicated worker or external render service.",
}

export async function GET() {
  return NextResponse.json(DISABLED_RESPONSE, { status: 501 })
}

export async function POST() {
  return NextResponse.json(DISABLED_RESPONSE, { status: 501 })
}
