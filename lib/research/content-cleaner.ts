import { encodingNormalizer } from "./encoding-normalizer"

export function contentCleaner(text: string): string {
  return encodingNormalizer(text)
    .replace(/privacy statement/gi, "")
    .replace(/newsletter/gi, "")
    .replace(/subscribe/gi, "")
    .replace(/thank you!/gi, "")
    .replace(/cookie/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000)
}
