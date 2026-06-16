import { repairMojibakeChars } from "./encoding-normalizer"

export function contentSafeNormalizer(text: string): string {
  if (!text) return text

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