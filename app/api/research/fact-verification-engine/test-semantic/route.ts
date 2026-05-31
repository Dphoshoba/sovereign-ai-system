import { NextResponse } from "next/server"

import { factVerificationEngine } from "../../../../../lib/research/fact-verification-engine"
import type { ExtractedFact } from "../../../../../lib/research/fact-extractor"

export async function GET() {
  const facts: ExtractedFact[] = [
    {
      claim:
        "Generative AI can create original content such as text, images, video and other media.",
      evidenceId: "test-evidence-1",
      sourceTitle: "IBM",
      sourceUrl: "https://ibm.com",
      sourceType: "technology explainer",
      evidenceText:
        "Generative AI can create original text, images, video and other content.",
      confidence: "high",
      requiresHumanReview: true,
    },
    {
      claim:
        "Generative AI systems can produce text, images, video and other forms of media.",
      evidenceId: "test-evidence-2",
      sourceTitle: "Google",
      sourceUrl: "https://google.com",
      sourceType: "technology explainer",
      evidenceText:
        "Generative AI systems can produce text, images, video and other forms of media.",
      confidence: "high",
      requiresHumanReview: true,
    },
  ]

  const result = factVerificationEngine(facts)

  return NextResponse.json({
    ok: true,
    result,
  })
}
