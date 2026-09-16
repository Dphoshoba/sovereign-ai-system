import { load } from "cheerio";
import { isChromePassage } from "./evidence-chrome";

const STRIP_SELECTORS = [
  "script",
  "style",
  "noscript",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "iframe",
  "button",
  "svg",
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
  "[class*='social']",
  "[class*='share-bar']",
  "[class*='related']",
  "[class*='recommend']",
  "[class*='promo']",
].join(", ");

const PREFERRED_SELECTORS = [
  "article",
  "main",
  "[role='main']",
  ".article-body",
  ".article-content",
  ".insight-article",
  ".c-article",
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

export function extractHtmlDocument(html: string): {
  title: string;
  extractedText: string;
} {
  const $ = load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  $(STRIP_SELECTORS).remove();

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
    extractedText = collectParagraphs($, $("body").length ? $("body") : $.root());
  }

  extractedText = extractedText.replace(/\n{2,}/g, "\n").trim();

  return { title, extractedText };
}
