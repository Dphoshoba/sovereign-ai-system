type ResearchInput = {
  niche: string
}

export function researchAgent(
  input: ResearchInput
) {
  const researchAreas = [
    {
      topic: `${input.niche} trends`,
      relevance: 99,
      usefulness: 99,
      opportunity: 99,
    },
    {
      topic: `${input.niche} audience questions`,
      relevance: 99,
      usefulness: 99,
      opportunity: 98,
    },
    {
      topic: `${input.niche} emerging opportunities`,
      relevance: 98,
      usefulness: 99,
      opportunity: 99,
    },
    {
      topic: `${input.niche} common misconceptions`,
      relevance: 99,
      usefulness: 98,
      opportunity: 99,
    },
  ]

  const rankedResearch = researchAreas
    .map((item) => ({
      ...item,
      researchScore: Math.round(
        (item.relevance +
          item.usefulness +
          item.opportunity) / 3
      ),
    }))
    .sort(
      (a, b) =>
        b.researchScore - a.researchScore
    )

  const dominantResearch = rankedResearch[0]

  return {
    autonomousResearchAgent: true,
    niche: input.niche,
    rankedResearch,
    dominantResearch,
    researchDirective:
      `Research priority: "${dominantResearch.topic}"`,
    nextStage:
      "Ready for content planning intelligence.",
  }
}
