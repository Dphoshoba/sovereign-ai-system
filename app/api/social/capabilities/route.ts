import { NextResponse } from "next/server"
import { getSupportedPlatforms } from "@/lib/platform/execution/provider-contracts/social-provider"
import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const platforms = getSupportedPlatforms()
  return NextResponse.json({ ok: true, platforms })
}
