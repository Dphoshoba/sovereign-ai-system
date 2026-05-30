import { searchAdapter } from "./search-adapter"

export type SourceRecord = {
  title: string
  url: string
  sourceType: string
  relevanceScore: number
}

export type SourceCollectionResult = {
  topic: string
  collectedSources: SourceRecord[]
  sourceCount: number
  collectionStatus: string
}

export async function sourceCollector(
  topic: string
): Promise<SourceCollectionResult> {
  const collectedSources = await searchAdapter(topic)

  return {
    topic,
    collectedSources,
    sourceCount: collectedSources.length,
    collectionStatus:
      collectedSources.length > 0
        ? "Sources collected successfully."
        : "No sources collected. Search provider is not connected yet.",
  }
}
