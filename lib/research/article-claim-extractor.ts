import { isChromePassage, isOutlineOrIndexPassage } from "./evidence-chrome";

export const CREATOR_TEMPLATE_CLAIMS = [
  "AI-driven analytics can improve content performance insights.",
  "AI automation can reduce manual formatting and repurposing effort.",
  "AI-supported workflows can help creators plan audience engagement.",
  "AI automation can reduce repetitive creator tasks.",
  "AI automation can improve creator workflows.",
  "AI-assisted drafting can support content production.",
  "AI tools can assist with content editing workflows.",
  "AI can improve content production efficiency for creators.",
  "AI tools can support content planning and outlining.",
  "AI tools can support creator packaging tasks such as titles, captions, and summaries.",
  "AI can support creator monetization and revenue workflow planning.",
  "AI tools can support creator ideation and creative planning.",
  "Responsible and ethical AI use remains important for creators.",
  "Human review remains important before publishing AI-assisted content.",
] as const;

export type ArticleSection = "title" | "excerpt" | "body";

export type ArticleBlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "blockquote"
  | "link";

export type ArticleClaimKind = "factual" | "authorial";

export type ArticleClaim = {
  claim: string;
  articleExcerpt: string;
  section: ArticleSection;
  blockType: ArticleBlockType;
  kind: ArticleClaimKind;
  heading?: string | null;
};

export const FACTUAL_CLAIM_LIMIT = 12;
export const CLAIM_BATCH_LIMIT = 3;
export const FACTUAL_CLAIM_CEILING = FACTUAL_CLAIM_LIMIT * CLAIM_BATCH_LIMIT;

export type NotScoredClaim = {
  text: string;
  section: string;
};

export type ArticleClaimExtractionResult = {
  claims: ArticleClaim[];
  notScoredClaims: NotScoredClaim[];
  authorialAssertions: ArticleClaim[];
  claimCount: number;
  authorialCount: number;
  normalizedArticleText: string;
  extractionStatus: string;
};

export type ArticleBlock = {
  section: ArticleSection;
  blockType: ArticleBlockType;
  text: string;
  heading: string | null;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "about",
  "what",
  "when",
  "where",
  "will",
  "have",
  "has",
  "are",
  "was",
  "were",
  "why",
  "how",
  "its",
  "their",
  "them",
  "they",
  "you",
  "your",
  "our",
  "can",
  "may",
  "not",
  "but",
  "also",
  "than",
  "then",
]);

const AUTHORIAL_PATTERNS = [
  /^this article\b/i,
  /^the shift begins\b/i,
  /\bthat can be useful\b/i,
  /^it is not\b/i,
  /^see\b/i,
  /^also see\b/i,
  /^founders may\b/i,
  /\binfrastructure is dependable because\b/i,
  /\bthis article'?s model\b/i,
  /\bcalls? to action\b/i,
  /\bin the next (section|step)\b/i,
  /\bechoes\s*&\s*visions['’]?s?\s+strategic framework\b/i,
  /\bfive-layer model\b/i,
  /\bfive parts(?:—|-|,)/i,
  /\bour synthesis\b/i,
  /\bnot a (third-party )?standard issued by\b/i,
  /\bfor this article,?\b.{0,120}\bmeans\b/i,
  /\bwe (can help you|recommend|suggest)\b/i,
  /\brequest an?\b.{0,80}\bconsultation\b/i,
  /\bpractical advice\b/i,
  /\bpractical (first )?workflow\b/i,
  /\bthe best first system\b/i,
  /\bchoose measures tied to the workflow\b/i,
  /\bthese are practical measurement suggestions\b/i,
  /\bwe use that as an architectural interpretation\b/i,
  /\barchitectural interpretation\b/i,
  /^that is bibleproject/i,
  /\bnamed-source reading\b/i,
  /\bliterary reading\b/i,
];

const ADVICE_PATTERNS = [
  /\bstart with\b/i,
  /\ba named person still checks\b/i,
];

const FICTION_LABEL = /\b(fictional|illustration)\b/i;

const PUBLISHER_ATTRIBUTION_NAME =
  /\b(microsoft|outlook|copilot|google|gmail|gemini|workspace|meta|facebook|instagram|threads|intuit|quickbooks|xero|jax|nist)\b/i;

const PUBLISHER_ATTRIBUTION_VERB =
  /\b(says|states|notes|warns|describes|lists|requires|shows|documents|reports|includes)\b/i;

const FACTUAL_SIGNAL = new RegExp(
  [
    "\\baccording to\\b",
    "\\breports? that\\b",
    "\\bfound that\\b",
    "\\bshowed that\\b",
    "\\bestimates? that\\b",
    "\\bsurvey\\b",
    "\\bstudy\\b",
    "\\bresearch report\\b",
    "\\brisk management framework\\b",
    "\\bprediction\\b",
    "\\bnist\\b",
    "\\bdeloitte\\b",
    "\\bpwc\\b",
    "\\bcdo magazine\\b",
    "\\bcdo-style\\b",
    "\\boecd\\b",
    "\\brisk management\\b",
    "\\bai rmf\\b",
    "\\bknowledge layer\\b",
    "\\brather than\\b.{0,80}\\b(tools|infrastructure)\\b",
    "\\bshould be integrated\\b",
    "\\bartificial intelligence\\b.{0,80}\\b(governance|infrastructure|risk)\\b",
    "\\bgovernance\\b.{0,80}\\bartificial intelligence\\b",
    "\\d+\\s*%",
    "\\bpercent\\b",
  ].join("|"),
  "i",
);

export function normalizeArticleText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[_#>`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function articleContainsExcerpt(
  normalizedArticleText: string,
  excerpt: string,
): boolean {
  const needle = excerpt.replace(/\s+/g, " ").trim();
  if (!needle) return false;
  return normalizedArticleText.includes(needle);
}

export function splitMarkdownBlocks(
  markdown: string,
  section: ArticleSection,
): ArticleBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];
  let currentType: ArticleBlockType = "paragraph";
  let current: string[] = [];
  let currentHeading: string | null = null;

  const flush = () => {
    const text = current.join("\n").trim();
    if (text) {
      blocks.push({
        section,
        blockType: currentType,
        text,
        heading: currentHeading,
      });
    }
    current = [];
    currentType = "paragraph";
  };

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      flush();
      const text = line.replace(/^#{1,6}\s+/, "").trim();
      currentHeading = text;
      blocks.push({
        section,
        blockType: "heading",
        text,
        heading: text,
      });
      continue;
    }
    if (/^>\s?/.test(line)) {
      if (currentType !== "blockquote") flush();
      currentType = "blockquote";
      current.push(line.replace(/^>\s?/, ""));
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      if (currentType !== "list") flush();
      currentType = "list";
      current.push(line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, ""));
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    if (currentType !== "paragraph") flush();
    currentType = "paragraph";
    current.push(line);
  }
  flush();
  return blocks;
}

const SENTENCE_BOUNDARY =
  /(?<=(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Vol|No|pp))[.!?](?:["“”'’)\]]+)?)(?:\[\d+\])?\s+/;

export function splitBlockSentences(blockText: string): string[] {
  const normalized = normalizeArticleText(blockText);
  if (!normalized) return [];
  if (!/[.!?]/.test(normalized)) return [normalized];
  return normalized
    .split(SENTENCE_BOUNDARY)
    .map((sentence) => sentence.replace(/\[\d+\]/g, "").trim())
    .filter(Boolean);
}

const CLAIM_SHAPE =
  /\b(is|are|was|were|be|can|could|may|might|will|has|have|helps|supports|improves|reduces|increases|requires|remains|shows|suggests|become|becomes|treats|treated|provides|integrate|integrated|should|distinguishes|describes|argues|notes|emphasizes|states|says|warns|assigned|fell|found|rose)\b/i;

const MEASURABLE_NUMERICAL_RESULT = /\b\d+(?:\.\d+)?\s*(?:%|percent)\b/i;

function hasMeasurableNumericalResult(sentence: string): boolean {
  return MEASURABLE_NUMERICAL_RESULT.test(sentence);
}

function hasClaimShape(sentence: string): boolean {
  return CLAIM_SHAPE.test(sentence);
}

function isCreatorTemplate(sentence: string, articleText: string): boolean {
  const normalized = sentence.replace(/\s+/g, " ").trim().toLowerCase();
  return CREATOR_TEMPLATE_CLAIMS.some((template) => {
    const templateNormalized = template.toLowerCase();
    if (normalized !== templateNormalized) return false;
    return !articleText.toLowerCase().includes(templateNormalized);
  });
}

export function isFictionalLabel(value: string): boolean {
  return FICTION_LABEL.test(value);
}

export function hasPublisherAttribution(sentence: string): boolean {
  return (
    PUBLISHER_ATTRIBUTION_NAME.test(sentence) &&
    PUBLISHER_ATTRIBUTION_VERB.test(sentence)
  );
}

export function isAuthorialFraming(sentence: string): boolean {
  const normalized = sentence.replace(/\s+/g, " ").trim();
  return (
    AUTHORIAL_PATTERNS.some((pattern) => pattern.test(normalized)) ||
    ADVICE_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

function isHardAuthorialFraming(sentence: string): boolean {
  const normalized = sentence.replace(/\s+/g, " ").trim();
  return AUTHORIAL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isAdviceFraming(sentence: string): boolean {
  const normalized = sentence.replace(/\s+/g, " ").trim();
  return ADVICE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isExternallyVerifiableClaim(sentence: string): boolean {
  if (isChromePassage(sentence)) return false;
  if (isHardAuthorialFraming(sentence)) return false;
  if (hasPublisherAttribution(sentence)) return true;
  if (isAdviceFraming(sentence)) return false;
  return FACTUAL_SIGNAL.test(sentence);
}

export function recommendationWithUnscoredClaims<T extends string>(
  recommendation: T,
  notScoredClaims: readonly NotScoredClaim[],
): T {
  if (notScoredClaims.length > 0 && recommendation === "publish-ready") {
    return "review-required" as T;
  }
  return recommendation;
}

function sectionLabel(claim: ArticleClaim): string {
  if (claim.section === "title") return "title";
  if (claim.section === "excerpt") return "excerpt";
  return claim.heading?.trim() || "introduction";
}

function selectFactualClaims(candidates: ArticleClaim[]): {
  claims: ArticleClaim[];
  notScoredClaims: NotScoredClaim[];
} {
  const selected: ArticleClaim[] = [];
  const selectedIndexes = new Set<number>();
  const headingOrder: string[] = [];
  const firstByHeading = new Map<string, number>();

  candidates.forEach((candidate, index) => {
    if (candidate.section !== "body" || !candidate.heading) return;
    if (firstByHeading.has(candidate.heading)) return;
    firstByHeading.set(candidate.heading, index);
    headingOrder.push(candidate.heading);
  });

  for (const heading of headingOrder) {
    if (selected.length >= FACTUAL_CLAIM_LIMIT) break;
    const index = firstByHeading.get(heading);
    if (index === undefined) continue;
    selected.push(candidates[index]);
    selectedIndexes.add(index);
  }

  candidates.forEach((candidate, index) => {
    if (selected.length >= FACTUAL_CLAIM_LIMIT) return;
    if (selectedIndexes.has(index)) return;
    selected.push(candidate);
    selectedIndexes.add(index);
  });

  return {
    claims: selected,
    notScoredClaims: candidates
      .filter((_, index) => !selectedIndexes.has(index))
      .map((candidate) => ({
        text: candidate.claim,
        section: sectionLabel(candidate),
      })),
  };
}

export type ClaimBatch<T> = {
  index: number;
  claims: T[];
};

export type ClaimBatchPlan<T> = {
  batches: ClaimBatch<T>[];
  eligibleClaims: T[];
  overflowClaims: T[];
};

export function planClaimBatches<T>(claims: readonly T[]): ClaimBatchPlan<T> {
  const eligibleClaims = claims.slice(0, FACTUAL_CLAIM_CEILING);
  const overflowClaims = claims.slice(FACTUAL_CLAIM_CEILING);
  const batches: ClaimBatch<T>[] = [];
  for (
    let offset = 0;
    offset < eligibleClaims.length && batches.length < CLAIM_BATCH_LIMIT;
    offset += FACTUAL_CLAIM_LIMIT
  ) {
    batches.push({
      index: batches.length,
      claims: eligibleClaims.slice(offset, offset + FACTUAL_CLAIM_LIMIT),
    });
  }
  return { batches, eligibleClaims, overflowClaims };
}

export function extractArticleClaims(input: {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
}): ArticleClaimExtractionResult {
  const fields: Array<{ section: ArticleSection; value: string }> = [
    input.title ? { section: "title" as const, value: input.title } : null,
    input.excerpt ? { section: "excerpt" as const, value: input.excerpt } : null,
    input.content ? { section: "body" as const, value: input.content } : null,
  ].filter((field): field is { section: ArticleSection; value: string } =>
    Boolean(field && field.value.trim()),
  );

  const normalizedArticleText = normalizeArticleText(
    fields.map((field) => field.value).join("\n"),
  );

  const factualCandidates: ArticleClaim[] = [];
  const authorialAssertions: ArticleClaim[] = [];
  const seen = new Set<string>();
  let authorialCount = 0;
  let fictionalRegion = false;

  for (const field of fields) {
    const fieldBlocks =
      field.section === "body"
        ? splitMarkdownBlocks(field.value, field.section)
        : [{
            section: field.section,
            blockType: "paragraph" as const,
            text: field.value,
            heading: null,
          }];

    for (const block of fieldBlocks) {
      if (block.blockType === "heading") {
        fictionalRegion = isFictionalLabel(block.text);
        authorialCount += 1;
        continue;
      }

      const fictionalBlock = fictionalRegion || isFictionalLabel(block.text);

      for (const sentence of splitBlockSentences(block.text)) {
        if (sentence.length > 400) continue;
        if (sentence.length < 40 && !hasMeasurableNumericalResult(sentence)) continue;
        if (isChromePassage(sentence)) continue;
        if (!hasClaimShape(sentence) && !hasPublisherAttribution(sentence)) continue;
        if (isCreatorTemplate(sentence, normalizedArticleText)) continue;
        if (!articleContainsExcerpt(normalizedArticleText, sentence)) continue;
        const key = sentence.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const kind: ArticleClaimKind =
          fictionalBlock || !isExternallyVerifiableClaim(sentence)
            ? "authorial"
            : "factual";
        const extractedClaim: ArticleClaim = {
          claim: sentence,
          articleExcerpt: sentence,
          section: block.section,
          blockType: block.blockType,
          kind,
          heading: block.heading,
        };
        if (kind === "authorial") {
          authorialCount += 1;
          authorialAssertions.push(extractedClaim);
          continue;
        }

        factualCandidates.push(extractedClaim);
      }
    }
  }

  const selected = selectFactualClaims(factualCandidates);

  return {
    claims: selected.claims,
    notScoredClaims: selected.notScoredClaims,
    authorialAssertions,
    claimCount: selected.claims.length,
    authorialCount,
    normalizedArticleText,
    extractionStatus:
      selected.claims.length > 0
        ? "Factual claims extracted from the current article."
        : "No auditable factual claims occur in the current article.",
  };
}

const GENERIC_NAME_TOKENS = new Set([
  "samuel",
  "david",
  "israel",
  "saul",
  "goliath",
  "philistine",
  "philistines",
  "bibleproject",
  "biblegateway",
  "jesse",
  "bethlehem",
  "according",
  "chapter",
  "narrative",
  "article",
  "guide",
  "books",
]);

export function significantTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

const PERCENTAGE_VALUE = /\b(\d+(?:\.\d+)?)(?:\s*%|\s+percent\b)/gi;

export function percentageValues(text: string): number[] {
  const values: number[] = [];
  for (const match of text.matchAll(new RegExp(PERCENTAGE_VALUE.source, "gi"))) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

export function passageContainsClaimPercentages(claim: string, passage: string): boolean {
  const required = new Set(percentageValues(claim));
  if (required.size === 0) return true;
  const present = new Set(percentageValues(passage));
  for (const value of required) {
    if (!present.has(value)) return false;
  }
  return true;
}

export function uniqueContentOverlap(claim: string, passage: string): {
  claimTokens: string[];
  overlap: string[];
} {
  const claimTokens = [...new Set(significantTokens(claim))];
  const passageTokens = new Set(significantTokens(passage));
  return {
    claimTokens,
    overlap: claimTokens.filter((token) => passageTokens.has(token)),
  };
}

export function eventActionTokens(claim: string): string[] {
  return significantTokens(claim).filter((token) => !GENERIC_NAME_TOKENS.has(token));
}

export type PassageSupportFailureReason =
  | "supported"
  | "empty-passage"
  | "chrome"
  | "outline-or-index"
  | "missing-percentage"
  | "no-claim-tokens"
  | "insufficient-overlap"
  | "insufficient-action-tokens";

export type PassageSupportAssessment = {
  supported: boolean;
  overlapCount: number;
  requiredOverlap: number;
  actionTokenMatches: string[];
  missingActionTokens: string[];
  failureReason: PassageSupportFailureReason;
};

function requiredOverlapCount(tokenCount: number): number {
  return Math.min(Math.max(3, Math.ceil(tokenCount * 0.35)), tokenCount);
}

export function assessPassageSupport(
  claim: string,
  passage: string,
  options: { documentKind?: "html" | "pdf" } = {},
): PassageSupportAssessment {
  const empty = (
    failureReason: PassageSupportFailureReason,
    details: Partial<PassageSupportAssessment> = {},
  ): PassageSupportAssessment => ({
    supported: false,
    overlapCount: 0,
    requiredOverlap: 0,
    actionTokenMatches: [],
    missingActionTokens: [],
    failureReason,
    ...details,
  });

  if (!passage) return empty("empty-passage");
  if (options.documentKind !== "pdf" && isChromePassage(passage)) {
    return empty("chrome");
  }
  if (options.documentKind !== "pdf" && isOutlineOrIndexPassage(passage)) {
    return empty("outline-or-index");
  }
  if (!passageContainsClaimPercentages(claim, passage)) {
    return empty("missing-percentage");
  }

  const { claimTokens, overlap } = uniqueContentOverlap(claim, passage);
  if (claimTokens.length === 0) return empty("no-claim-tokens");
  const requiredOverlap = requiredOverlapCount(claimTokens.length);
  const passageTokens = new Set(significantTokens(passage));
  const actionTokens = [...new Set(eventActionTokens(claim))];
  const actionTokenMatches = actionTokens.filter((token) => passageTokens.has(token));
  const missingActionTokens = actionTokens.filter((token) => !passageTokens.has(token));
  const measured = {
    overlapCount: overlap.length,
    requiredOverlap,
    actionTokenMatches,
    missingActionTokens,
  };

  if (overlap.length < requiredOverlap) {
    return empty("insufficient-overlap", measured);
  }
  if (
    actionTokens.length >= 2 &&
    actionTokenMatches.length < Math.min(2, actionTokens.length)
  ) {
    return empty("insufficient-action-tokens", measured);
  }
  return {
    supported: true,
    failureReason: "supported",
    ...measured,
  };
}

export function passageSupportsClaim(
  claim: string,
  passage: string,
  options: { documentKind?: "html" | "pdf" } = {},
): boolean {
  return assessPassageSupport(claim, passage, options).supported;
}

function clauseRemainsVerifiable(parent: string, clause: string): boolean {
  if (clause.length > 400) return false;
  if (clause.length < 40 && !hasMeasurableNumericalResult(clause)) return false;
  if (isChromePassage(clause)) return false;
  if (isExternallyVerifiableClaim(clause)) return true;
  if (!isExternallyVerifiableClaim(parent)) return false;
  if (isAuthorialFraming(clause)) return false;
  return hasClaimShape(clause);
}

function clausesAt(sentence: string, pattern: RegExp): string[] {
  return sentence
    .split(pattern)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function verifiableClauses(sentence: string): string[] {
  if (sentence.includes(";")) {
    const semicolonClauses = clausesAt(sentence, /\s*;\s*/);
    if (
      semicolonClauses.length >= 2 &&
      semicolonClauses.every((part) => clauseRemainsVerifiable(sentence, part))
    ) {
      return semicolonClauses;
    }
  }

  const andClauses = clausesAt(sentence, /\s*,\s+and\s+/i);
  if (
    andClauses.length >= 2 &&
    andClauses.slice(1).every((part) => /^that\b/i.test(part)) &&
    andClauses.every((part) => clauseRemainsVerifiable(sentence, part))
  ) {
    return andClauses;
  }

  return [sentence];
}
