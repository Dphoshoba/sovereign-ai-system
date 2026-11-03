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

function collectParagraphs($: ReturnType<typeof load>, root: ReturnType<typeof $>,): string {
  const blocks = root
    .find("p, h1, h2, h3, li")
    .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
    .get()
    .filter((line) => line.length >= 40 && !isChromePassage(line));

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
  for (const selector of PREFERRED_SELECTORS) {
    const node = $(selector).first();
    if (!node.length) continue;
    const candidate = collectParagraphs($, node);
    if (candidate.length >= 80) {
      extractedText = candidate;
      break;
    }
  }

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
