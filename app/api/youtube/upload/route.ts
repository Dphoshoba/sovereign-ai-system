import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const disabledResponse = {
  ok: false,
  disabled: true,
  error:
    "YouTube upload is disabled on Vercel because this route exceeds serverless size limits. Use a dedicated worker or external upload service.",
}

export async function GET() {
  return NextResponse.json(disabledResponse, { status: 501 })
}

export async function POST() {
  return NextResponse.json(disabledResponse, { status: 501 })
}
