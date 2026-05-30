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

export function sourceCollector(
  topic: string
): SourceCollectionResult {
  return {
    topic,

    collectedSources: [],

    sourceCount: 0,

    collectionStatus:
      "Source collection not yet connected to live search.",
  }
}
