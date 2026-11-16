import type { SourceRecord } from "./source-collector"
import { scriptureSourcesFromTopic } from "./scripture-ref"

const AI_SOURCES: SourceRecord[] = [
  { title: "OpenAI", url: "https://openai.com", sourceType: "authority", relevanceScore: 90 },
  { title: "Microsoft AI", url: "https://www.microsoft.com/ai", sourceType: "authority", relevanceScore: 88 },
  { title: "Google AI", url: "https://ai.google", sourceType: "authority", relevanceScore: 86 },
  { title: "IBM Artificial Intelligence", url: "https://www.ibm.com/artificial-intelligence", sourceType: "authority", relevanceScore: 84 },
  { title: "Stanford HAI", url: "https://hai.stanford.edu", sourceType: "academic", relevanceScore: 82 },
  { title: "NIST AI", url: "https://www.nist.gov/artificial-intelligence", sourceType: "government", relevanceScore: 78 },
]

const HISTORY_SOURCES: SourceRecord[] = [
  { title: "Britannica", url: "https://www.britannica.com", sourceType: "encyclopedia", relevanceScore: 90 },
  { title: "History.com", url: "https://www.history.com", sourceType: "history-reference", relevanceScore: 82 },
  { title: "National Archives", url: "https://www.archives.gov", sourceType: "government-archive", relevanceScore: 88 },
]

const HEALTH_SOURCES: SourceRecord[] = [
  { title: "World Health Organization", url: "https://www.who.int", sourceType: "health-authority", relevanceScore: 95 },
  { title: "CDC", url: "https://www.cdc.gov", sourceType: "health-authority", relevanceScore: 92 },
  { title: "NIH", url: "https://www.nih.gov", sourceType: "health-research", relevanceScore: 90 },
]

const SPACE_SOURCES: SourceRecord[] = [
  { title: "NASA", url: "https://www.nasa.gov", sourceType: "space-authority", relevanceScore: 95 },
  { title: "ESA", url: "https://www.esa.int", sourceType: "space-authority", relevanceScore: 90 },
  { title: "Space.com", url: "https://www.space.com", sourceType: "space-media", relevanceScore: 78 },
]

const MOTIVATION_SOURCES: SourceRecord[] = [
  { title: "APA", url: "https://www.apa.org", sourceType: "psychology-authority", relevanceScore: 88 },
  { title: "Harvard Business Review", url: "https://hbr.org", sourceType: "leadership-research", relevanceScore: 82 },
  { title: "Greater Good Science Center", url: "https://greatergood.berkeley.edu", sourceType: "wellbeing-research", relevanceScore: 84 },
]

/**
 * Category fallback when search returns nothing.
 * Bible-stories: derive passages from the topic, or return [] (safe failure).
 * Never substitutes an unrelated hard-coded biblical story.
 */
export function fallbackSources(
  topic: string,
  category = "ai-tools"
): SourceRecord[] {
  const normalizedCategory = category.toLowerCase()

  if (normalizedCategory.includes("bible")) {
    return scriptureSourcesFromTopic(topic)
  }
  if (normalizedCategory.includes("history")) return HISTORY_SOURCES
  if (normalizedCategory.includes("health")) return HEALTH_SOURCES
  if (normalizedCategory.includes("space")) return SPACE_SOURCES
  if (normalizedCategory.includes("motivation")) return MOTIVATION_SOURCES

  return AI_SOURCES
}
