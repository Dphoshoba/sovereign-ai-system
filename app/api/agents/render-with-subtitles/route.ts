export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const disabledResponse = {
  ok: false,
  disabled: true,
  error:
    "Subtitle video rendering is disabled on Vercel because this route exceeds the serverless function size limit. Use a dedicated worker or external rendering service.",
}

export async function GET() {
  return Response.json(disabledResponse, { status: 501 })
}

export async function POST() {
  return Response.json(disabledResponse, { status: 501 })
}
