import { trendDiscoveryAgent } from "./trend-discovery-agent"

type GenerationInput = {
  niche?: string
  audience?: string
}

export async function contentGenerationLoopAgent(
  input: GenerationInput
) {
  const niche =
    input.niche || "AI + Faith"

  const audience =
    input.audience ||
    "faith-tech creators"

  const trends =
    trendDiscoveryAgent({
      niche,
    })

  const selectedTopic =
    trends.topTrend.topic

  const generatedScript = `
Welcome to Echoes & Visions.

Today we explore:
"${selectedTopic}"

Artificial intelligence is rapidly transforming
content creation, communication, ministry,
and human creativity itself.

But the real question is:
How should creators adapt?

In this video we explore the future of
autonomous systems, AI storytelling,
and intelligent media infrastructure.

Let's begin.
`

  return {
    autonomousLoop: true,

    niche,
    audience,

    trendFusion: true,

    selectedTrend:
      trends.topTrend,

    generatedAssets: {
      script: generatedScript,

      thumbnailConcept:
        "Futuristic AI cinematic emotional human expression",

      shortsIdeas: [
        `3 Reasons ${selectedTopic} Matters`,
        `The Future of ${selectedTopic}`,
        `${selectedTopic} Explained`,
      ],
    },

    strategicRecommendation:
      trends.strategicRecommendation,

    nextStage:
      "Ready for autonomous execution pipeline.",
  }
}