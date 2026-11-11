import { requireEditorAuth } from "../../../../lib/publishing/require-editor-auth"
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const disabledResponse = {
  ok: false,
  disabled: true,
  error:
    "YouTube publishing agent is disabled on Vercel because this function exceeds the serverless size limit. Use a dedicated worker or external publishing service.",
}

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return Response.json(disabledResponse, { status: 501 })
}

export async function POST() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return Response.json(disabledResponse, { status: 501 })
}
