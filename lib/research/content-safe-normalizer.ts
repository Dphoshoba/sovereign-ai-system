/**
 * Fix mojibake and HTML entities in Markdown without destroying structure.
 *
 * Applies a minimal per-line character repair only — no global whitespace
 * collapse, no spacing repair, no latin1 roundtrip. Fenced code blocks and
 * blank lines are left untouched.
 */
function normalizeMarkdownLine(line: string): string {
  return line
    .replace(/\u00e2\u0080\u0099/g, "'")
    .replace(/\u00e2\u0080\u0098/g, "'")
    .replace(/\u00e2\u0080\u009c/g, '"')
    .replace(/\u00e2\u0080\u009d/g, '"')
    .replace(/\u00e2\u0080\u0094/g, "—")
    .replace(/\u00e2\u0080\u0093/g, "–")
    .replace(/\u00e2\u0080\u00a6/g, "…")
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€"/g, '"')
    .replace(/â€"/g, "—")
    .replace(/â€"/g, "–")
    .replace(/â€¦/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function contentSafeNormalizer(text: string): string {
  if (!text) return text

  // Split on fenced code blocks so their contents stay byte-for-byte intact.
  const segments = text.split(/(```[\s\S]*?```)/g)

  return segments
    .map((segment) => {
      // Leave fenced code blocks untouched (indentation/spacing is significant).
      if (segment.startsWith("```")) {
        return segment
      }

      // Normalize each line on its own so the newline structure is preserved.
      return segment
        .split("\n")
        .map((line) => {
          if (line.trim() === "") return ""

          const leading = line.match(/^\s*/)?.[0] ?? ""
          return leading + normalizeMarkdownLine(line.trimStart())
        })
        .join("\n")
    })
    .join("")
}
