export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const disabledResponse = {
  ok: false,
  disabled: true,
  error:
    "YouTube Shorts generation is disabled on Vercel because this function exceeds the serverless size limit. Use a dedicated worker or external render service.",
}

export async function GET() {
  return Response.json(disabledResponse, { status: 501 })
}

export async function POST() {
  return Response.json(disabledResponse, { status: 501 })
}
