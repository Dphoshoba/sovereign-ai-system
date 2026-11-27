import { NextRequest, NextResponse } from "next/server"

import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
import { contentFetcher } from "../../../../lib/research/content-fetcher"

export async function POST(req: NextRequest) {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  const body = await req.json()

  const result = await contentFetcher(
    body.url,
    body.title
  )

  return NextResponse.json(result)
}
