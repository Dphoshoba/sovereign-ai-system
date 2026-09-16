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
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='dialog']",
].join(", ");

function collectText($: ReturnType<typeof load>, selector: string): string {
  return $(selector)
    .map((_, element) => $(element).text())
    .get()
    .join("\n");
}

export function extractHtmlDocument(html: string): {
  title: string;
  extractedText: string;
} {
  const $ = load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  $(STRIP_SELECTORS).remove();

  const preferred = ["article", "main", "[role='main']", ".article-body", "#content"]
    .map((selector) => collectText($, selector).trim())
    .find((text) => text.length >= 80);

  const raw = preferred || $("body").text() || $.root().text();
  const extractedText = raw
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 20 && !isChromePassage(line))
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return { title, extractedText };
}
