import { NextResponse } from "next/server"
import { requirePublishingEditor } from "../../../../lib/publishing/require-editor-auth"

/**
 * EV-OPS-03-P2: plural send is retired. It previously hard-coded a placeholder
 * From address and was a bypass risk. Use POST /api/newsletter/send only.
 */
export async function POST() {
  const auth = await requirePublishingEditor()
  if (!auth.ok) return auth.response

  return NextResponse.json(
    {
      ok: false,
      code: "route_retired",
      error:
        "POST /api/newsletters/send is retired. Use POST /api/newsletter/send.",
    },
    { status: 410 },
  )
}
