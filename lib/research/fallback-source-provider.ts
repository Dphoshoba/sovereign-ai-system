export function fallbackSources(topic: string) {
    return [
      {
        title: "OpenAI",
        url: "https://openai.com",
        sourceType: "authority",
        relevanceScore: 90,
      },
      {
        title: "Microsoft AI",
        url: "https://www.microsoft.com/ai",
        sourceType: "authority",
        relevanceScore: 85,
      },
      {
        title: "Google AI",
        url: "https://ai.google",
        sourceType: "authority",
        relevanceScore: 85,
      },
    ]
  }