import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const disabledResponse = {
  ok: false,
  disabled: true,
  error:
    "YouTube Shorts upload is disabled on Vercel because this route exceeds serverless size limits.",
}

export async function GET() {
  return NextResponse.json(disabledResponse, { status: 501 })
}

export async function POST() {
  return NextResponse.json(disabledResponse, { status: 501 })
}
