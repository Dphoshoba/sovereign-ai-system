import { repairMojibakeChars } from "./encoding-normalizer"

/**
 * Fix mojibake and HTML entities in Markdown without destroying structure.
 *
 * Uses the full repairMojibakeChars pipeline per line so article content gets
 * the same fixes as excerpt/SEO, but without collapsing newlines or whitespace.
 */
export function contentSafeNormalizer(text: string): string {
  if (!text) return text

  // Split on fenced code blocks so their contents stay byte-for-byte intact.
  const segments = text.split(/(```[\s\S]*?```)/g)

  return segments
    .map((segment) => {
      if (segment.startsWith("```")) {
        return segment
      }

      return segment
        .split("\n")
        .map((line) => {
          if (line.trim() === "") return ""

          const leading = line.match(/^\s*/)?.[0] ?? ""
          return leading + repairMojibakeChars(line.trimStart())
        })
        .join("\n")
    })
    .join("")
}
