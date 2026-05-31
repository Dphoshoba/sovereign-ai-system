import { NextResponse } from "next/server"
import { encodingNormalizer } from "../../../../lib/research/encoding-normalizer"

export async function GET() {
  const sample = "itâs important donât canât wonât"

  return NextResponse.json({
    original: sample,
    normalized: encodingNormalizer(sample),
  })
}
