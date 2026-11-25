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
 * (text outside quotation marks). Stewardship contribution applications are
 * handled separately by STEWARDSHIP_APPLICATION_RE so measurable statistics
 * with "Christians today" framing remain Category C / externally verifiable.
 * Callers: classifyBiblicalClaimCategory, isStewardshipPastoralApplication,
 * isExternallyVerifiableClaim. User instruction: distinguish pastoral
 * application from quotation; apply heading/claim distinction.
 */
const INTERPRETATION_OUTSIDE_QUOTES_RE =
  /\b(?:christians?\s+today|for\s+believers(?:\s+today)?|practical\s+(?:guidance|application|examples?|steps?)|typolog(?:y|ical)|symboli[sz]es|spiritual(?:ly)?\s+(?:means|represents|signifies)|teaches\s+us\s+that|we\s+(?:should|must|ought)|pastoral|application\s+for|this\s+(?:means|shows\s+that)\s+(?:we|believers|christians)|illustrates?\s+the\s+(?:danger|importance|need)|analogy\s+for)\b/i

/** Stewardship teaching shapes — not empirical survey / population statistics. */
const STEWARDSHIP_APPLICATION_RE =
  /\b(?:customary\s+\d+\s*%\s+contribution|full\s+extent\s+of\s+(?:our|the)\s+responsibility|responsibility\s+to\s+(?:god|christ)|should\s+(?:therefore\s+)?not\s+be\s+regarded|in\s+light\s+of\s+this\s+teaching|our\s+lives\s+themselves\s+become\s+the\s+offering)\b/i

const EXTERNAL_FACT_RE =
  /\b(?:archaeolog|carbon[- ]dat|radiocarbon|peer[- ]reviewed|statistic|survey\s+found|percent|percentage|excavation|inscription\s+discovered|scientific\s+study|according\s+to\s+(?:historians?|scientists?|researchers?))\b/i

const BOOK_NAMES_RE =
  "(?:genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms?|proverbs|ecclesiastes|song(?:\\s+of\\s+solomon)?|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)"

/**
 * Thematic section title: short "Label: Theme (Book N:N–N)".
 * Parenthetical must be scripture reference(s) only — no embedded statistics.
 */
const SCRIPTURE_PAREN_RE = `(?:\\(\\s*(?:[1-3]\\s+)?${BOOK_NAMES_RE}\\s+\\d{1,3}(?::\\d{1,3}(?:\\s*[–-]\\s*\\d{1,3})?)?(?:\\s*[,;]\\s*(?:[1-3]\\s+)?${BOOK_NAMES_RE}\\s+\\d{1,3}(?::\\d{1,3}(?:\\s*[–-]\\s*\\d{1,3})?)?)*\\s*\\))`

const THEMATIC_EDITORIAL_HEADING_RE = new RegExp(
  `^[A-Z0-9][^:,.]{1,50}:\\s+[^()]{2,100}${SCRIPTURE_PAREN_RE}$`,
  "i",
)

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

function normalizeEditionId(raw: string): string {
  const id = raw.replace(/_/g, "").toLowerCase()
  if (id === "kjv" || id === "kingjames" || id === "kingjamesversion") return "kjv"
  return id
}

export function scriptureEditionFromSource(source: {
  url: string
  title?: string | null
}): string | null {
  if (!isScriptureHostUrl(source.url)) return null
  const blob = `${source.url} ${source.title ?? ""}`
  const version = blob.match(/[?&]version=([A-Za-z0-9_+-]+)/i)
  if (version?.[1]) {
    return normalizeEditionId(version[1])
  }
  // Bible Hub edition path: /esv/colossians/3.htm, /kjv/..., etc.
  const hubEdition = source.url.match(
    /biblehub\.com\/([a-z0-9_+-]+)\/[a-z0-9_]+\/\d+\.htm/i,
  )
  if (hubEdition?.[1]) {
    return normalizeEditionId(hubEdition[1])
  }
  const namedEdition = blob.match(
    /\b(ESV|NIV|NASB|NKJV|NLT|CSB|RSV|NRSV|WEB|ASV)\b/i,
  )
  if (namedEdition?.[1]) {
    return normalizeEditionId(namedEdition[1])
  }
  if (TRANSLATION_RE.test(blob) || /kingjamesbibleonline/i.test(blob)) return "kjv"
  // Bible Hub / Blue Letter Bible chapter pages without an edition token default to KJV.
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
  return (
    INTERPRETATION_OUTSIDE_QUOTES_RE.test(commentary) ||
    STEWARDSHIP_APPLICATION_RE.test(commentary)
  )
}

/**
 * Stewardship / responsibility pastoral applications (e.g. customary
 * contribution teaching). These must not be scored as externally verifiable
 * publisher facts. Survey / archaeology / science language remains Category C.
 * An unrelated % / percent statistic after removing the customary contribution
 * phrase keeps the claim externally auditable.
 */
export function isStewardshipPastoralApplication(claim: string): boolean {
  if (isCategoryCExternalFactClaim(claim)) return false
  const commentary = claimCommentaryOutsideQuotes(claim)
  if (!STEWARDSHIP_APPLICATION_RE.test(commentary)) return false
  const withoutCustomary = commentary.replace(
    /\bcustomary\s+\d+\s*%\s+contribution\b/gi,
    " ",
  )
  if (
    /\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*percent\b/i.test(withoutCustomary)
  ) {
    return false
  }
  return true
}

/** @deprecated Prefer isStewardshipPastoralApplication for verification gates. */
export function isPastoralApplicationClaim(claim: string): boolean {
  return isStewardshipPastoralApplication(claim)
}

/**
 * Editorial thematic headings (including numbered list titles) that cite a
 * passage as a section label. Not automatic exemption: headings with quotes,
 * digits outside the scripture parenthetical, empirical percentages, or
 * survey/archaeology markers remain scrutinised.
 */
export function isThematicEditorialHeading(text: string): boolean {
  const t = text.replace(/^\d+[.)]\s*/, "").replace(/\s+/g, " ").trim()
  if (!t || t.length > 160) return false
  if (/[“"‘'].+[”"'’]/.test(t)) return false
  // "%" is non-word; do not require a trailing \b (e.g. "40%: …").
  if (/\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*percent\b/i.test(t)) return false
  // Digits outside the closing scripture parenthetical imply a factual body.
  const withoutScriptureParen = t.replace(/\([^)]*\)\s*$/, "")
  if (/\d/.test(withoutScriptureParen)) return false
  // Prose attributions and survey/science markers are not section titles.
  if (
    /\b(?:according\s+to|survey|study\s+found|archaeolog|peer[- ]reviewed)\b/i.test(
      t,
    )
  ) {
    return false
  }
  const label = t.split(":")[0]?.trim() ?? ""
  const body = withoutScriptureParen.includes(":")
    ? withoutScriptureParen.slice(withoutScriptureParen.indexOf(":") + 1).trim()
    : ""
  if (
    /\b(?:is|are|was|were|has|have|warns?|says|said|states|describes?)\b/i.test(
      label,
    )
  ) {
    return false
  }
  // Factual narrative verbs in the theme body keep the line auditable.
  if (
    /\b(?:killed|drowned|counted|rose|fell|was|were|is|are|has|have|says|said|states|records|describes)\b/i.test(
      body,
    )
  ) {
    return false
  }
  return THEMATIC_EDITORIAL_HEADING_RE.test(t)
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
  // Stewardship applications are Category B even when they mention a customary
  // contribution figure; true Category C markers (survey/archaeology/science)
  // still win via isCategoryCExternalFactClaim.
  if (isCategoryCExternalFactClaim(claim)) return "C"
  if (isStewardshipPastoralApplication(claim)) return "B"
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
