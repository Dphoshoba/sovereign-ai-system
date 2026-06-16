function fixMojibake(text: string): string {
  const bad = String.fromCharCode(226)

  return text
    .replace(new RegExp(`([A-Za-z])${bad}s\\b`, "g"), "$1's")
    .replace(new RegExp(`([A-Za-z])${bad}t\\b`, "g"), "$1't")
    .replace(new RegExp(`([A-Za-z])${bad}re\\b`, "g"), "$1're")
    .replace(new RegExp(`([A-Za-z])${bad}ll\\b`, "g"), "$1'll")
    .replace(new RegExp(`([A-Za-z])${bad}ve\\b`, "g"), "$1've")
    .replace(new RegExp(`([A-Za-z])${bad}m\\b`, "g"), "$1'm")
    .replace(new RegExp(`([A-Za-z])${bad}d\\b`, "g"), "$1'd")
    .replace(new RegExp(`\\s*${bad}\\s*`, "g"), " - ")
    .replace(/\s+/g, " ")
}

function fixHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x26;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function repairMojibakeChars(text: string): string {
  if (!text) return text
  return fixMojibake(fixHtmlEntities(text)).trim()
}

export function encodingNormalizer(text: string): string {
  return repairMojibakeChars(text)
}