export type EvidenceChunk = {
  id: string
  text: string
  wordCount: number
}

const SENTENCE_BOUNDARY =
  /(?<=(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Vol|No|pp))[.!?])(?:["“”'’)\]]+)?(?:\[\d+\])?\s+/

function wordsOf(value: string): string[] {
  return value.split(/\s+/).filter(Boolean)
}

function capFor(chunkSize: number): number {
  return Number.isFinite(chunkSize) && chunkSize >= 1 ? Math.floor(chunkSize) : 120
}

function endsSentence(value: string): boolean {
  return /[.!?]["“”'’)\]]*$/.test(value)
}

function paragraphsFromLines(text: string): string[] {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const paragraphs: string[] = []
  let current = ""

  for (const line of lines) {
    current = current ? `${current} ${line}` : line
    if (endsSentence(current)) {
      paragraphs.push(current)
      current = ""
    }
  }

  if (current) paragraphs.push(current)
  return paragraphs
}

function sentencesOf(paragraph: string): string[] {
  return paragraph
    .split(SENTENCE_BOUNDARY)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

/**
 * A sentence longer than the cap cannot stay whole. Split it on word
 * boundaries into ordered pieces of at most `chunkSize` words. Every word
 * is kept once, and the 120-word cap is not raised.
 */
function splitOversizedSentence(sentence: string, cap: number): string[] {
  const words = wordsOf(sentence)
  const pieces: string[] = []
  for (let index = 0; index < words.length; index += cap) {
    pieces.push(words.slice(index, index + cap).join(" "))
  }
  return pieces
}

export function evidenceChunker(
  text: string,
  chunkSize = 120,
): EvidenceChunk[] {
  const cap = capFor(chunkSize)
  const pieces: string[] = []

  for (const paragraph of paragraphsFromLines(text)) {
    let current: string[] = []
    let count = 0
    const flush = () => {
      if (current.length === 0) return
      pieces.push(current.join(" "))
      current = []
      count = 0
    }

    for (const sentence of sentencesOf(paragraph)) {
      const sentenceWords = wordsOf(sentence)
      if (sentenceWords.length > cap) {
        flush()
        pieces.push(...splitOversizedSentence(sentence, cap))
        continue
      }
      if (count > 0 && count + sentenceWords.length > cap) flush()
      current.push(sentence)
      count += sentenceWords.length
    }

    flush()
  }

  return pieces.filter(Boolean).map((piece, index) => ({
    id: `chunk-${index + 1}`,
    text: piece,
    wordCount: wordsOf(piece).length,
  }))
}
