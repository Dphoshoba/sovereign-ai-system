import { isChromePassage } from "./evidence-chrome";

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
};

export type ArticleClaimExtractionResult = {
  claims: ArticleClaim[];
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
  /\bstart with\b/i,
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
];

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

  const flush = () => {
    const text = current.join("\n").trim();
    if (text) {
      blocks.push({ section, blockType: currentType, text });
    }
    current = [];
    currentType = "paragraph";
  };

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      flush();
      blocks.push({
        section,
        blockType: "heading",
        text: line.replace(/^#{1,6}\s+/, "").trim(),
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

export function splitBlockSentences(blockText: string): string[] {
  const normalized = normalizeArticleText(blockText);
  if (!normalized) return [];
  if (!/[.!?]/.test(normalized)) return [normalized];
  return normalized
    .split(/(?<=\.)(?:\[\d+\])?\s+|(?<=[!?])\s+/)
    .map((sentence) => sentence.replace(/\[\d+\]/g, "").trim())
    .filter(Boolean);
}

const CLAIM_SHAPE =
  /\b(is|are|was|were|be|can|could|may|might|will|has|have|helps|supports|improves|reduces|increases|requires|remains|shows|suggests|become|becomes|treats|treated|provides|integrate|integrated|should|distinguishes|describes|argues|notes|emphasizes|states|says|warns)\b/i;

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

export function isAuthorialFraming(sentence: string): boolean {
  const normalized = sentence.replace(/\s+/g, " ").trim();
  return AUTHORIAL_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isExternallyVerifiableClaim(sentence: string): boolean {
  if (isAuthorialFraming(sentence)) return false;
  if (isChromePassage(sentence)) return false;
  return FACTUAL_SIGNAL.test(sentence);
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

  const claims: ArticleClaim[] = [];
  const authorialAssertions: ArticleClaim[] = [];
  const seen = new Set<string>();
  let authorialCount = 0;

  for (const field of fields) {
    const fieldBlocks =
      field.section === "body"
        ? splitMarkdownBlocks(field.value, field.section)
        : [{ section: field.section, blockType: "paragraph" as const, text: field.value }];

    for (const block of fieldBlocks) {
      if (block.blockType === "heading") {
        authorialCount += 1;
        continue;
      }

      for (const sentence of splitBlockSentences(block.text)) {
        if (sentence.length < 40 || sentence.length > 400) continue;
        if (isChromePassage(sentence)) continue;
        if (!hasClaimShape(sentence)) continue;
        if (isCreatorTemplate(sentence, normalizedArticleText)) continue;
        if (!articleContainsExcerpt(normalizedArticleText, sentence)) continue;
        const key = sentence.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const kind: ArticleClaimKind = isExternallyVerifiableClaim(sentence)
          ? "factual"
          : "authorial";
        const extractedClaim: ArticleClaim = {
          claim: sentence,
          articleExcerpt: sentence,
          section: block.section,
          blockType: block.blockType,
          kind,
        };
        if (kind === "authorial") {
          authorialCount += 1;
          authorialAssertions.push(extractedClaim);
          continue;
        }

        claims.push(extractedClaim);
        if (claims.length >= 12) break;
      }
      if (claims.length >= 12) break;
    }
    if (claims.length >= 12) break;
  }

  return {
    claims,
    authorialAssertions,
    claimCount: claims.length,
    authorialCount,
    normalizedArticleText,
    extractionStatus:
      claims.length > 0
        ? "Factual claims extracted from the current article."
        : "No auditable factual claims occur in the current article.",
  };
}

export function significantTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function passageSupportsClaim(
  claim: string,
  passage: string,
  options: { documentKind?: "html" | "pdf" } = {},
): boolean {
  if (!passage) return false;
  if (options.documentKind !== "pdf" && isChromePassage(passage)) return false;
  const claimTokens = significantTokens(claim);
  if (claimTokens.length === 0) return false;
  const passageTokens = new Set(significantTokens(passage));
  const overlap = claimTokens.filter((token) => passageTokens.has(token));
  const required = Math.min(
    Math.max(3, Math.ceil(claimTokens.length * 0.35)),
    claimTokens.length,
  );
  return overlap.length >= required;
}
