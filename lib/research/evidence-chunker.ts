export type EvidenceChunk = {
  id: string
  text: string
  wordCount: number
}

export function evidenceChunker(
  text: string,
  chunkSize = 120
): EvidenceChunk[] {
  const words = text
    .split(/\s+/)
    .filter(Boolean)

  const chunks: EvidenceChunk[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize)
    const text = chunkWords.join(" ")

    if (text.trim().length > 0) {
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        text,
        wordCount: chunkWords.length,
      })
    }
  }

  return chunks
}
