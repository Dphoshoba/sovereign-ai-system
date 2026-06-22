import type { SourceRecord } from "./source-collector"

export function fallbackSources(topic: string): SourceRecord[] {
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
      relevanceScore: 88,
    },
    {
      title: "Google AI",
      url: "https://ai.google",
      sourceType: "authority",
      relevanceScore: 86,
    },
    {
      title: "IBM Artificial Intelligence",
      url: "https://www.ibm.com/artificial-intelligence",
      sourceType: "authority",
      relevanceScore: 84,
    },
    {
      title: "NVIDIA AI",
      url: "https://www.nvidia.com/en-us/ai/",
      sourceType: "authority",
      relevanceScore: 82,
    },
    {
      title: "Stanford HAI",
      url: "https://hai.stanford.edu",
      sourceType: "academic",
      relevanceScore: 82,
    },
    {
      title: "MIT Technology Review AI",
      url: "https://www.technologyreview.com/topic/artificial-intelligence/",
      sourceType: "research-media",
      relevanceScore: 80,
    },
    {
      title: "McKinsey AI",
      url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights",
      sourceType: "industry-research",
      relevanceScore: 78,
    },
    {
      title: "NIST AI",
      url: "https://www.nist.gov/artificial-intelligence",
      sourceType: "government",
      relevanceScore: 78,
    },
    {
      title: "OECD AI",
      url: "https://oecd.ai",
      sourceType: "policy",
      relevanceScore: 76,
    },
  ]
}