import { trendAgent } from "./trend-agent"
import { researchAgent } from "./research-agent"
import { scriptAgent } from "./script-agent"
import { hookAgent } from "./hook-agent"
import { thumbnailAgent } from "./thumbnail-agent"
import { shortsAgent } from "./shorts-agent"
import { seoAgent } from "./seo-agent"
import { publishingAgent } from "./publishing-agent"
import { analyticsAgent } from "./analytics-agent"
import { strategyAgent } from "./strategy-agent"
import { memoryAgent } from "./memory-agent"

export async function runCreatorSystem() {
  const memory = await memoryAgent()

  const trends = await trendAgent()

  const selectedTopic = trends.trendingTopics[0]

  const research = await researchAgent(selectedTopic)

  const script = await scriptAgent(selectedTopic)

  await memory.remember({
    topic: selectedTopic,
    title: script.title,
    thumbnailStyle: "bold",
    ctr: 5.4,
    retention: 52,
    views: 250,
    outcome: "winning",
  })

  const hooks = await hookAgent(script)

  const thumbnails = await thumbnailAgent(script.title)

  const shorts = await shortsAgent(script)

  const seo = await seoAgent(script.title)

  const publishing = await publishingAgent()

  const analytics = await analyticsAgent()

  const strategy = await strategyAgent()

  return {
    selectedTopic,
    research,
    script,
    hooks,
    thumbnails,
    shorts,
    seo,
    publishing,
    analytics,
    strategy,
    memoryInsights: {
      bestTopics: memory.getBestTopics(),
      bestTitles: memory.getBestTitles(),
      bestThumbnailStyles: memory.getBestThumbnailStyles(),
    },
  }
}
