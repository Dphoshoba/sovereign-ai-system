type ContentPlannerInput = {
  niche: string
  researchTopic: string
}

export function contentPlannerAgent(
  input: ContentPlannerInput
) {
  const contentAssets = [
    {
      type: "Blog Article",
      title: `The Future of ${input.researchTopic}`,
      priority: "high",
    },
    {
      type: "YouTube Video",
      title: `What Christians Need To Know About ${input.researchTopic}`,
      priority: "high",
    },
    {
      type: "Newsletter",
      title: `${input.researchTopic}: Weekly Insights`,
      priority: "medium",
    },
    {
      type: "Social Post",
      title: `${input.researchTopic} Quick Take`,
      priority: "medium",
    },
  ]

  return {
    autonomousContentPlanner: true,
    niche: input.niche,
    researchTopic: input.researchTopic,
    contentAssets,
    primaryAsset: contentAssets[0],
    nextStage: "Ready for writer agent.",
  }
}
