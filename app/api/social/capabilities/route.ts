import { NextResponse } from "next/server"
import { getSupportedPlatforms } from "@/lib/platform/execution/provider-contracts/social-provider"

export async function GET() {
  const platforms = getSupportedPlatforms()
  return NextResponse.json({ ok: true, platforms })
}
