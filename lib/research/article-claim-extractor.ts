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

export type ArticleClaim = {
  claim: string;
  articleExcerpt: string;
};

export type ArticleClaimExtractionResult = {
  claims: ArticleClaim[];
  claimCount: number;
  normalizedArticleText: string;
  extractionStatus: string;
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
  "into",
]);

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

function hasClaimShape(sentence: string): boolean {
  return /\b(is|are|was|were|be|can|could|may|might|will|has|have|helps|supports|improves|reduces|increases|requires|remains|shows|suggests|become|becomes|treats|treated|provides|integrate|integrated|should)\b/i.test(
    sentence,
  );
}

function isCreatorTemplate(sentence: string, articleText: string): boolean {
  const normalized = sentence.replace(/\s+/g, " ").trim().toLowerCase();
  return CREATOR_TEMPLATE_CLAIMS.some((template) => {
    const templateNormalized = template.toLowerCase();
    if (normalized !== templateNormalized) return false;
    return !articleText.toLowerCase().includes(templateNormalized);
  });
}

export function extractArticleClaims(input: {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
}): ArticleClaimExtractionResult {
  const fields = [input.title, input.excerpt, input.content].filter(
    (value): value is string => Boolean(value && value.trim()),
  );
  const normalizedArticleText = normalizeArticleText(fields.join("\n"));
  const sentences: string[] = [];

  for (const field of fields) {
    const normalizedField = normalizeArticleText(field);
    const parts = /[.!?]/.test(normalizedField)
      ? normalizedField.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim())
      : [normalizedField];
    sentences.push(...parts.filter(Boolean));
  }

  const claims: ArticleClaim[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    if (sentence.length < 40 || sentence.length > 400) continue;
    if (isChromePassage(sentence)) continue;
    if (!hasClaimShape(sentence)) continue;
    if (isCreatorTemplate(sentence, normalizedArticleText)) continue;
    if (!articleContainsExcerpt(normalizedArticleText, sentence)) continue;
    const key = sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    claims.push({
      claim: sentence,
      articleExcerpt: sentence,
    });
    if (claims.length >= 12) break;
  }

  return {
    claims,
    claimCount: claims.length,
    normalizedArticleText,
    extractionStatus:
      claims.length > 0
        ? "Claims extracted from the current article."
        : "No auditable claims occur in the current article.",
  };
}

export function significantTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function passageSupportsClaim(claim: string, passage: string): boolean {
  if (!passage || isChromePassage(passage)) return false;
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
