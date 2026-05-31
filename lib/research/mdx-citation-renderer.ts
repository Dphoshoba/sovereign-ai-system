import type { CitationRecord } from "./citation-builder"

function formatStatus(status: string) {
  return status
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ")
}

export function mdxCitationRenderer(
  citations: CitationRecord[]
): string {
  if (citations.length === 0) {
    return `## Citations

No citation records available.
`
  }

  return `## Citations

${citations
  .map(
    (citation, index) => `### Citation ${index + 1}

**Claim:** ${citation.claim}

**Verification Status:** ${formatStatus(
      citation.verificationStatus
    )}

**Verification Method:** ${formatStatus(
      citation.verificationMethod
    )}

**Verification Count:** ${citation.verificationCount}

**Sources:**

${citation.sources
  .map(
    (source) =>
      `- [${source.title}](${source.url})
  - Evidence ID: ${source.evidenceId}`
  )
  .join("\n")}
`
  )
  .join("\n")}
`
}
