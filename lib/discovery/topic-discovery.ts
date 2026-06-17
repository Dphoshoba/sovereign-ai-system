export type DiscoveredTopic = {
    title: string
    source: string
    category: string
  }
  
  export async function topicDiscovery(): Promise<DiscoveredTopic[]> {
    return [
      {
        title: "AI Automation for Churches",
        source: "seed",
        category: "ai-automation",
      },
      {
        title: "AI Agents for Small Business",
        source: "seed",
        category: "ai-automation",
      },
      {
        title: "The Future of AI Content Creation",
        source: "seed",
        category: "ai-automation",
      },
    ]
  }