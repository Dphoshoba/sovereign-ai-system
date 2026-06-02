import type { SourceRecord } from "./source-collector"
import { getOpenAI } from "@/lib/ai/openai"

type RawSource = {
  title?: unknown
  url?: unknown
  sourceType?: unknown
}

function resolveProvider(): string {
  const explicit = process.env.SEARCH_PROVIDER

  if (explicit && explicit.trim().length > 0) {
    return explicit.trim().toLowerCase()
  }

  // Default to the OpenAI-backed source finder when a key is available,
  // otherwise behave as before (no sources).
  return process.env.OPENAI_API_KEY ? "openai" : "none"
}

function normalizeSources(raw: unknown): SourceRecord[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const sources: SourceRecord[] = []

  raw.forEach((entry, index) => {
    const candidate = entry as RawSource
    const url = typeof candidate.url === "string" ? candidate.url.trim() : ""

    if (!/^https?:\/\//i.test(url)) return
    if (seen.has(url)) return
    seen.add(url)

    const title =
      typeof candidate.title === "string" && candidate.title.trim().length > 0
        ? candidate.title.trim()
        : url

    const sourceType =
      typeof candidate.sourceType === "string" &&
      candidate.sourceType.trim().length > 0
        ? candidate.sourceType.trim()
        : "article"

    sources.push({
      title,
      url,
      sourceType,
      // Earlier sources are ranked higher; downstream evidenceRegistry maps
      // this into a confidence label. Real grounding still depends on the
      // content actually fetched from the URL.
      relevanceScore: Math.max(40, 90 - index * 8),
    })
  })

  return sources
}

async function openAiSourceSearch(topic: string): Promise<SourceRecord[]> {
  try {
    const response = await getOpenAI().responses.create({
      model: "gpt-5.2",
      instructions:
        "You are a meticulous research librarian. Return only real, well-established, " +
        "publicly accessible reference URLs from authoritative sources such as official " +
        "documentation, reputable publications, peer-reviewed research, and established " +
        "organizations. Never invent or guess URLs. If you are not confident a URL exists, " +
        "omit it. Return only valid JSON. No markdown wrapper. No explanations.",
      input:
        `List up to 6 authoritative, currently-live web sources useful for researching: "${topic}". ` +
        'Return JSON only in this exact format: ' +
        '{"sources":[{"title":"...","url":"https://...","sourceType":"article|documentation|research|news|organization"}]}.',
    })

    const parsed = JSON.parse(response.output_text)
    return normalizeSources(parsed?.sources)
  } catch (error) {
    console.error("searchAdapter (openai provider) failed:", error)
    return []
  }
}

export async function searchAdapter(
  topic: string
): Promise<SourceRecord[]> {
  const provider = resolveProvider()

  if (provider === "openai") {
    return openAiSourceSearch(topic)
  }

  // Unknown or "none" providers return nothing so the pipeline can report a
  // clean "no sources collected" state rather than fabricating evidence.
  return []
}
