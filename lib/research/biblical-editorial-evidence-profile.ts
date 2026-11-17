/**
 * Behaviour: EV-BIBLE-AUTHORITY-001 Biblical Editorial Evidence Profile.
 * Callers: lib/research/claim-source-attribution.ts (eligibility),
 * lib/research/versioned-evidence.ts (identity + exclusive primary),
 * lib/research/consensus-engine.ts (scripture authority score).
 * Existing files encode only Mission-006 exclusive-primary helpers; none encode
 * permanent Category A/B/C, quote-aware interpretation stripping, or edition identity.
 * User instruction: "Introduce a reusable Biblical Editorial Evidence Profile
 * within the existing EV-REG 1.1.0 governance architecture."
 */
import {
  hasScriptureCitation,
  isScriptureHostUrl,
  parseScriptureRefs,
} from "./scripture-ref"

export const EV_BIBLE_AUTHORITY_001 = "EV-BIBLE-AUTHORITY-001" as const

/** Canonical identity for KJV edition text (hosts collapse here). */
export const SCRIPTURE_KJV_IDENTITY = "scripture:kjv" as const

/** @deprecated Alias retained for callers; equals SCRIPTURE_KJV_IDENTITY. */
export const SCRIPTURE_TEXT_IDENTITY = SCRIPTURE_KJV_IDENTITY

/** Documented authority for scripture-edition access hosts (not a hard-coded pass). */
export const SCRIPTURE_EDITION_AUTHORITY_SCORE = 85

export const BIBLICAL_TEACHING_CATEGORIES = [
  "bible-stories",
  "bible-study",
  "sermon",
  "devotional",
  "christian-teaching",
  "biblical-teaching",
] as const

export type BiblicalClaimCategory = "A" | "B" | "C"

export type ScripturePassageHint = {
  url: string
  title?: string | null
  passage?: string
}

const TRANSLATION_RE = /\b(?:KJV|King James(?:\s+Version)?)\b/i

/**
 * Pastoral / interpretive markers evaluated only on authorial commentary
 * (text outside quotation marks).
 */
const INTERPRETATION_OUTSIDE_QUOTES_RE =
  /\b(?:christians?\s+today|for\s+believers(?:\s+today)?|practical\s+(?:guidance|application|examples?|steps?)|typolog(?:y|ical)|symboli[sz]es|spiritual(?:ly)?\s+(?:means|represents|signifies)|teaches\s+us\s+that|we\s+(?:should|must|ought)|pastoral|application\s+for|this\s+(?:means|shows\s+that)\s+(?:we|believers|christians)|illustrates?\s+the\s+(?:danger|importance|need)|analogy\s+for)\b/i

const EXTERNAL_FACT_RE =
  /\b(?:archaeolog|carbon[- ]dat|radiocarbon|peer[- ]reviewed|statistic|survey\s+found|percent|percentage|excavation|inscription\s+discovered|scientific\s+study|according\s+to\s+(?:historians?|scientists?|researchers?))\b/i

const DIRECT_NARRATIVE_RE =
  /\b(?:warns|says|said|states|records|describes|answers|orders|accuses|delivers?|tells?|shows?|quotes?|includes|limits|requires?|permits?|replies?|continues)\b/i

export function stripQuotedRegions(text: string): string {
  return text
    .replace(/[“"][^”"]*[”"]/g, " ")
    .replace(/[‘'][^’']*[’']/g, " ")
}

export function claimCommentaryOutsideQuotes(claim: string): string {
  return stripQuotedRegions(claim).replace(/\s+/g, " ").trim()
}

export function isBiblicalTeachingCategory(category: string | null | undefined): boolean {
  if (!category) return false
  const key = category.trim().toLowerCase()
  if ((BIBLICAL_TEACHING_CATEGORIES as readonly string[]).includes(key)) return true
  return /\b(bible|biblical|sermon|devotional|scripture)\b/i.test(key)
}

export function isBiblicalTeachingArticle(input: {
  category?: string | null
  sourceTypes?: Array<string | null | undefined>
  content?: string | null
}): boolean {
  if (isBiblicalTeachingCategory(input.category)) return true
  if (input.sourceTypes?.some((t) => t === "scripture-reference")) return true
  if (input.content && parseScriptureRefs(input.content).length >= 2) return true
  return false
}

export function scriptureEditionFromSource(source: {
  url: string
  title?: string | null
}): string | null {
  if (!isScriptureHostUrl(source.url)) return null
  const blob = `${source.url} ${source.title ?? ""}`
  const version = blob.match(/[?&]version=([A-Za-z0-9_+-]+)/i)
  if (version?.[1]) {
    const id = version[1].replace(/_/g, "").toLowerCase()
    if (id === "kjv" || id === "kingjames" || id === "kingjamesversion") return "kjv"
    return id
  }
  if (TRANSLATION_RE.test(blob) || /kingjamesbibleonline/i.test(blob)) return "kjv"
  // Bible Hub / Blue Letter Bible chapter pages used on the KJV editorial pathway.
  if (/biblehub\.com|blueletterbible\.org/i.test(source.url)) return "kjv"
  return "kjv"
}

export function scriptureCanonicalIdentity(source: {
  url: string
  title?: string | null
}): string | null {
  const edition = scriptureEditionFromSource(source)
  if (!edition) return null
  return `scripture:${edition}`
}

export function scriptureAuthorityScoreForUrl(url: string): number | null {
  if (!isScriptureHostUrl(url)) return null
  return SCRIPTURE_EDITION_AUTHORITY_SCORE
}

export function hasNamedScriptureTranslation(
  claim: string,
  passages?: ScripturePassageHint[],
): boolean {
  if (TRANSLATION_RE.test(claim)) return true
  if (!passages?.length) return false
  return passages.some((p) => scriptureEditionFromSource(p) === "kjv")
}

export function isCategoryBInterpretationClaim(claim: string): boolean {
  const commentary = claimCommentaryOutsideQuotes(claim)
  return INTERPRETATION_OUTSIDE_QUOTES_RE.test(commentary)
}

export function isCategoryCExternalFactClaim(claim: string): boolean {
  return EXTERNAL_FACT_RE.test(claim)
}

function hasVerseLevelCitation(claim: string): boolean {
  return parseScriptureRefs(claim).some(
    (ref) => ref.verseStart != null && Number.isInteger(ref.verseStart),
  )
}

function hasDirectQuote(claim: string): boolean {
  return /[“"‘'].+[”"'’]/.test(claim)
}

function isFaithfulMultiVerseContrast(claim: string): boolean {
  const refs = parseScriptureRefs(claim)
  if (refs.filter((r) => r.verseStart != null).length < 2) return false
  if (isCategoryBInterpretationClaim(claim)) return false
  return (
    DIRECT_NARRATIVE_RE.test(claim) ||
    /\b(stated company|travelling party|restriction|contrast)\b/i.test(claim)
  )
}

/**
 * Category A structural shape: verse-level citation + quotation / narrative /
 * multi-verse explicit contrast, without Category B commentary outside quotes.
 */
export function isCategoryADirectScriptureClaim(claim: string): boolean {
  if (!hasScriptureCitation(claim)) return false
  if (!hasVerseLevelCitation(claim)) return false
  if (isCategoryBInterpretationClaim(claim)) return false
  if (isCategoryCExternalFactClaim(claim)) return false
  if (hasDirectQuote(claim)) return true
  if (isFaithfulMultiVerseContrast(claim)) return true
  if (
    DIRECT_NARRATIVE_RE.test(claim) ||
    /\baccording to\b/i.test(claim) ||
    /\bthe (?:narrative|passage|account|text) in\b/i.test(claim)
  ) {
    return true
  }
  return false
}

export function classifyBiblicalClaimCategory(claim: string): BiblicalClaimCategory {
  if (isCategoryCExternalFactClaim(claim)) return "C"
  if (isCategoryADirectScriptureClaim(claim)) return "A"
  if (hasScriptureCitation(claim) || isCategoryBInterpretationClaim(claim)) return "B"
  return "C"
}

/**
 * Exclusive primary-source eligibility for the EV-REG 1.1.0 pathway under
 * EV-BIBLE-AUTHORITY-001. Translation may be named in the claim or on
 * substantiating scripture edition sources.
 */
export function isExclusivePrimaryEligibleScriptureClaim(
  claim: string,
  options?: { passages?: ScripturePassageHint[] },
): boolean {
  if (!isCategoryADirectScriptureClaim(claim)) return false
  if (!hasNamedScriptureTranslation(claim, options?.passages)) return false
  return true
}

const MULTI_VERSE_FRAMING_RE =
  /\b(?:stated|company|includes?|reply|replies|limits?|going|records?|describes?|answers?|says|said|states|continues|requires?|permits?|according|narrative|passage|account|text)\b/gi

const MULTI_VERSE_STOP = new Set([
  "the",
  "and",
  "with",
  "that",
  "for",
  "are",
  "was",
  "were",
  "unto",
  "from",
  "into",
  "also",
  "only",
  "their",
  "them",
  "they",
  "this",
  "those",
  "shall",
  "will",
  "have",
  "has",
  "had",
  "not",
  "but",
  "our",
  "your",
  "you",
  "his",
  "her",
  "who",
  "whom",
  "which",
  "than",
  "then",
  "when",
  "where",
  "what",
])

/**
 * Faithful multi-verse Category A claims often paraphrase an explicit textual
 * contrast. Require distinctive content tokens (not framing verbs) to appear
 * in the passage evidence.
 */
export function categoryAMultiVersePassageSubstantiates(
  claim: string,
  passage: string,
): boolean {
  if (!isFaithfulMultiVerseContrast(claim)) return false
  const commentary = claimCommentaryOutsideQuotes(claim)
    .replace(MULTI_VERSE_FRAMING_RE, " ")
    .replace(
      /\b(?:genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalm|psalms|proverbs|ecclesiastes|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\b/gi,
      " ",
    )
  const tokens = [
    ...new Set(
      (commentary.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? []).filter(
        (t) => !MULTI_VERSE_STOP.has(t),
      ),
    ),
  ]
  if (tokens.length === 0) return false
  const lower = passage.toLowerCase()
  const hits = tokens.filter((t) => lower.includes(t))
  const needed = Math.max(2, Math.ceil(tokens.length * 0.5))
  return hits.length >= Math.min(needed, tokens.length)
}
