import { NextRequest, NextResponse } from "next/server"

import {
  claimSimilarity,
  claimsAreSimilar,
} from "../../../../lib/research/claim-similarity"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const claimA =
    body.claimA ||
    "Generative AI can create original content such as text, images, video and other media."

  const claimB =
    body.claimB ||
    "Generative AI systems can produce text, images, video and other forms of media."

  const threshold = body.threshold || 65

  return NextResponse.json({
    ok: true,
    claimA,
    claimB,
    threshold,
    similarityScore: claimSimilarity(claimA, claimB),
    similar: claimsAreSimilar(
      claimA,
      claimB,
      threshold
    ),
  })
}
