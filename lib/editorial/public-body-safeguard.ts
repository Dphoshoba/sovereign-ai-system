/**
 * Permanent editorial output-quality safeguard.
 *
 * Keeps internal audit / Director-review commentary out of public article bodies.
 * Legitimate article-voice uncertainty (e.g. "scholars debate X") is not blocked.
 *
 * Applied at prepare and schedule/publish boundaries for future workflow transitions.
 * Does not rewrite already-published articles or clear existing approvals.
 */

export type PublicBodyLeakKind =
  | "unresolved_concerns"
  | "audit_fingerprint"
  | "verification_status"
  | "source_comparison"
  | "editorial_assessment"
  | "approval_recommendation"
  | "workflow_instruction"
  | "agent_director_conversation"
  | "internal_workflow_commentary"

export type PublicBodyLeakFinding = {
  kind: PublicBodyLeakKind
  label: string
  excerpt: string
}

type LeakPattern = {
  kind: PublicBodyLeakKind
  label: string
  /** Matches a heading or labeled block that should not appear in public bodies. */
  match: RegExp
}

const LEAK_PATTERNS: LeakPattern[] = [
  {
    kind: "unresolved_concerns",
    label: "Unresolved concerns",
    match: /^(#{1,6}\s*|\*\*|__)?Unresolved concerns\b/im,
  },
  {
    kind: "audit_fingerprint",
    label: "Audit fingerprint",
    match:
      /^(#{1,6}\s*|\*\*|__)?(Audit\s+fingerprints?(?:\s+and\s+verification\s+status)?|contentFingerprint\s*[:=])/im,
  },
  {
    kind: "verification_status",
    label: "Verification status",
    match:
      /^(#{1,6}\s*|\*\*|__)?(Verification\s+status|Research\s+audit\s+verification)\b/im,
  },
  {
    kind: "source_comparison",
    label: "Internal source-comparison notes",
    match:
      /^(#{1,6}\s*|\*\*|__)?(Internal\s+source[- ]comparison(?:\s+notes?)?|Source[- ]comparison\s+notes?)\b/im,
  },
  {
    kind: "editorial_assessment",
    label: "AI-generated editorial assessment",
    match:
      /^(#{1,6}\s*|\*\*|__)?(AI[- ]generated\s+editorial\s+assessment|Editorial\s+assessment\s*\(AI\)|Director\s+editorial\s+assessment)\b/im,
  },
  {
    kind: "approval_recommendation",
    label: "Approval recommendation",
    match:
      /^(#{1,6}\s*|\*\*|__)?(Approval\s+recommendations?|publicationRecommendation\s*[:=]|Recommend(?:ation)?\s*:\s*(?:publish-ready|review-required|blocked))\b/im,
  },
  {
    kind: "workflow_instruction",
    label: "Save / revise / publish instruction",
    match:
      /^(#{1,6}\s*|>\s*|\*\*|__)?((?:Please\s+)?(?:save|revise|publish|re[- ]?audit)\s+(?:this|the)\s+(?:article|draft|revision)|Instructions?\s+to\s+(?:save|revise|publish))\b/im,
  },
  {
    kind: "agent_director_conversation",
    label: "AI agent / Director conversation",
    match:
      /^(#{1,6}\s*|\*\*|__)?(Conversation(?:s)?\s+between\s+(?:AI\s+)?agents?\s+and\s+the\s+Director|Director\s*[↔<>-]+\s*AI\s+agent|Agent\s+↔\s*Director)\b/im,
  },
  {
    kind: "internal_workflow_commentary",
    label: "Internal workflow / review-stage commentary",
    match:
      /^(#{1,6}\s*|\*\*|__)?(Internal\s+(?:workflow|review[- ]stage)\s+commentary|Review[- ]stage\s+commentary|HOLD\s*:\s*audit\s+completed|Prepare\s+for\s+Director\s+review\s+notes?)\b/im,
  },
]

const HEADING_LINE = /^(#{1,6})\s+/

function excerptAround(line: string, max = 120): string {
  const trimmed = line.trim().replace(/\s+/g, " ")
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

/**
 * Detect internal editorial / audit commentary that must not appear in public bodies.
 */
export function detectInternalEditorialLeak(
  content: string | null | undefined,
): PublicBodyLeakFinding[] {
  if (!content) return []

  const findings: PublicBodyLeakFinding[] = []
  const seen = new Set<PublicBodyLeakKind>()
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    for (const pattern of LEAK_PATTERNS) {
      if (seen.has(pattern.kind)) continue
      if (!pattern.match.test(trimmed)) continue
      seen.add(pattern.kind)
      findings.push({
        kind: pattern.kind,
        label: pattern.label,
        excerpt: excerptAround(trimmed),
      })
    }
  }

  return findings
}

export function hasInternalEditorialLeak(
  content: string | null | undefined,
): boolean {
  return detectInternalEditorialLeak(content).length > 0
}

/**
 * Block reason for prepare / approve / schedule / publish gates.
 * Returns null when the body is clear of internal editorial leaks.
 */
export function publicBodyLeakBlockReason(
  content: string | null | undefined,
): string | null {
  const findings = detectInternalEditorialLeak(content)
  if (findings.length === 0) return null

  const labels = findings.map((finding) => finding.label).join("; ")
  return (
    "Article body contains internal editorial or audit commentary that must not be published. " +
    `Remove these sections before prepare/approve/publish: ${labels}.`
  )
}

function isLeakHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  return LEAK_PATTERNS.some((pattern) => pattern.match.test(trimmed))
}

function headingLevel(line: string): number | null {
  const match = line.trim().match(HEADING_LINE)
  if (!match) return null
  return match[1].length
}

/**
 * Strip internal editorial sections from markdown for intentional cleanup.
 * Removes a matched heading and following lines until the next heading of
 * equal or higher rank (or end of document). Also drops standalone labeled
 * leak lines that are not markdown headings.
 *
 * Does not alter already-published records by itself — callers must opt in.
 */
export function stripInternalEditorialCommentary(
  content: string | null | undefined,
): string {
  if (!content) return content ?? ""

  const lines = content.split(/\r?\n/)
  const kept: string[] = []
  let skippingUntilLevel: number | null = null

  for (const line of lines) {
    if (skippingUntilLevel !== null) {
      const level = headingLevel(line)
      if (level !== null && level <= skippingUntilLevel) {
        skippingUntilLevel = null
      } else {
        continue
      }
    }

    if (!isLeakHeadingLine(line)) {
      kept.push(line)
      continue
    }

    const level = headingLevel(line)
    if (level !== null) {
      skippingUntilLevel = level
      continue
    }

    // Non-heading labeled leak line — drop this line only.
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
}
