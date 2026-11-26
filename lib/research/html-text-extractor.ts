import { load } from "cheerio";
import { contentCleaner } from "./content-cleaner";
import { isChromePassage } from "./evidence-chrome";

const JSON_LD_ARTICLE_MINIMUM = 80;

const HARD_STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "button",
  "svg",
  "form",
].join(", ");

const CHROME_STRIP_SELECTORS = [
  "nav",
  "header",
  "footer",
  "aside",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='dialog']",
  "[role='complementary']",
  "[id*='cookie']",
  "[class*='cookie']",
  "[id*='consent']",
  "[class*='consent']",
  "[class*='newsletter']",
  "[id*='newsletter']",
  "[class*='subscribe']",
].join(", ");

const PREFERRED_SELECTORS = [
  // Prefer explicit article bodies before generic <article>, which some help
  // centres reuse for promo/alert chrome (Zapier lt-article pattern).
  "[itemprop='articleBody']",
  ".lt-article__body",
  ".lt-article-container__article",
  ".lt-article__box",
  "article",
  "main",
  "[role='main']",
  ".article-body",
  ".article-content",
  ".insight-article",
  ".c-article",
  ".entry-content",
  ".post-content",
  ".td-post-content",
  ".node__content",
  ".field--name-body",
  ".field-name-body",
  ".article__body",
  "#content",
];

/** Sparse promo/alert shells can clear the minimum length but are not bodies. */
const PREFERRED_MIN_BLOCKS = 2;
const PREFERRED_DENSE_MIN_CHARS = 400;

function collectParagraphBlocks(
  $: ReturnType<typeof load>,
  root: ReturnType<typeof $>,
): string[] {
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

  const prose = root
    .find("p, h1, h2, h3, li")
    .map((_, element) => normalize($(element).text()))
    .get()
    .filter((line) => line.length >= 40 && !isChromePassage(line));

  // Help-centre comparison tables often label actions in short cells
  // (e.g. "Conversation", "Send Prompt") that fail the prose floor.
  const tableCells = root
    .find("td, th")
    .map((_, element) => normalize($(element).text()))
    .get()
    .filter((line) => line.length >= 3 && !isChromePassage(line));

  return [...prose, ...tableCells];
}

function collectParagraphs($: ReturnType<typeof load>, root: ReturnType<typeof $>,): string {
  const blocks = collectParagraphBlocks($, root);

  if (blocks.length >= 2) {
    return blocks.join("\n");
  }

  return root
    .text()
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 40 && !isChromePassage(line))
    .join("\n");
}

function isSubstantialPreferredCandidate(
  $: ReturnType<typeof load>,
  root: ReturnType<typeof $>,
  candidate: string,
): boolean {
  if (candidate.length < JSON_LD_ARTICLE_MINIMUM) return false;
  if (candidate.length >= PREFERRED_DENSE_MIN_CHARS) return true;
  return collectParagraphBlocks($, root).length >= PREFERRED_MIN_BLOCKS;
}

function schemaTypeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:www\.)?schema\.org\//, "");
}

function isSchemaArticleType(type: unknown): boolean {
  const values = Array.isArray(type) ? type : [type];
  return values.some(
    (value) => typeof value === "string" && schemaTypeName(value) === "article",
  );
}

function collectJsonLdNodes(value: unknown, nodes: Record<string, unknown>[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, nodes);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  nodes.push(record);
  if (Array.isArray(record["@graph"])) {
    for (const item of record["@graph"]) collectJsonLdNodes(item, nodes);
  }
}

function usableArticleText(value: string): string {
  const withBreaks = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n");
  const $ = load(`<div>${withBreaks}</div>`);
  $("script, style, noscript, iframe").remove();
  const lines = $("div")
    .text()
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 40 && !isChromePassage(line));
  return contentCleaner(lines.join("\n"));
}

function articleBodyFromJsonLd($: ReturnType<typeof load>): string {
  const scripts = $('script[type="application/ld+json"]');
  for (const element of scripts.toArray()) {
    const raw = $(element).text().trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const nodes: Record<string, unknown>[] = [];
    collectJsonLdNodes(parsed, nodes);
    for (const node of nodes) {
      if (!isSchemaArticleType(node["@type"])) continue;
      if (typeof node.articleBody !== "string") continue;
      const cleaned = usableArticleText(node.articleBody);
      if (cleaned.length >= JSON_LD_ARTICLE_MINIMUM) return cleaned;
    }
  }
  return "";
}

export function extractHtmlDocument(html: string): {
  title: string;
  extractedText: string;
} {
  const $ = load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  const jsonLdText = articleBodyFromJsonLd($);
  $(HARD_STRIP_SELECTORS).remove();

  let extractedText = "";
  let bestPreferred = "";
  for (const selector of PREFERRED_SELECTORS) {
    const node = $(selector).first();
    if (!node.length) continue;
    const candidate = collectParagraphs($, node);
    if (
      !isSubstantialPreferredCandidate($, node, candidate) ||
      candidate.length <= bestPreferred.length
    ) {
      continue;
    }
    bestPreferred = candidate;
  }
  extractedText = bestPreferred;

  if (!extractedText) {
    $(CHROME_STRIP_SELECTORS).remove();
    extractedText = collectParagraphs($, $("body").length ? $("body") : $.root());
  }

  extractedText = extractedText.replace(/\n{2,}/g, "\n").trim();
  if (extractedText.length < JSON_LD_ARTICLE_MINIMUM && jsonLdText) {
    extractedText = jsonLdText;
  }

  return { title, extractedText };
}
