import { encodingNormalizer } from "./encoding-normalizer"

// Common site chrome / boilerplate phrases that pollute extracted evidence.
const BOILERPLATE_PHRASES = [
  "privacy statement",
  "privacy policy",
  "cookie policy",
  "cookie settings",
  "newsletter",
  "subscribe",
  "sign up",
  "sign in",
  "log in",
  "get in touch",
  "contact us",
  "all rights reserved",
  "main navigation",
  "top stories",
  "latest stories",
  "home",
  "about",
  "search now",
  "popular topics",
  "share",
  "follow us",
]

// Whole navigation strings that frequently appear as a single run.
const NAV_FRAGMENTS = [
  "Home Top Stories Latest Stories",
  "Main navigation",
  "Search Now Popular Topics",
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function contentCleaner(text: string): string {
  let cleaned = encodingNormalizer(text)

  // Remove repeated navigation fragments first (longest, most specific).
  for (const fragment of NAV_FRAGMENTS) {
    cleaned = cleaned.replace(
      new RegExp(escapeRegExp(fragment), "gi"),
      " "
    )
  }

  // Remove boilerplate phrases case-insensitively, word-bounded so we don't
  // chop the middle out of real words.
  for (const phrase of BOILERPLATE_PHRASES) {
    cleaned = cleaned.replace(
      new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"),
      " "
    )
  }

  // Collapse excessive punctuation runs (bullets, pipes, separators).
  cleaned = cleaned
    .replace(/[•·▪◦‣*]{1,}/g, " ")
    .replace(/\|+/g, " ")
    .replace(/[-–—_=~]{2,}/g, " ")
    .replace(/\.{3,}/g, " ")
    .replace(/([!?,;:])\1+/g, "$1")

  // Line-level cleanup: trim, drop short fragments, drop duplicates.
  const seen = new Set<string>()
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length >= 15)
    .filter((line) => {
      const key = line.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  cleaned = lines.join("\n")

  // Normalize remaining whitespace.
  cleaned = cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim()

  // Preserve more real article content than before (5000 vs 3000).
  return cleaned.slice(0, 5000)
}
