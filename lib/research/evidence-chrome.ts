// HTML navigation/cookie/menu chrome only. Do not apply these phrases to a
// full PDF extract — PDFs commonly include "table of contents" and copyright
// lines that are not HTML chrome.
const CHROME_PHRASES = [
  "please enable javascript",
  "enable javascript",
  "javascript is disabled",
  "javascript required",
  "skip to main content",
  "skip to content",
  "skip to navigation",
  "cookie policy",
  "cookie settings",
  "cookie consent",
  "we use cookies",
  "accept all cookies",
  "accept cookies",
  "privacy policy",
  "terms of service",
  "terms of use",
  "subscribe to our newsletter",
  "subscribe to the newsletter",
  "sign up for our newsletter",
  "register now",
  "nominate now",
  "event registration",
  "sign in",
  "log in",
  "main navigation",
  "all rights reserved",
  "related content",
  "related articles",
  "related insights",
  "latest insights",
  "table of contents",
  "share this article",
  "follow us",
  "contact us",
];

const CHROME_PATTERNS = [
  /\bplease enable javascript\b/i,
  /\bjavascript (is )?(disabled|required)\b/i,
  /\bskip to (main )?content\b/i,
  /\bcookie (banner|notice|preferences)\b/i,
  /\bmanage cookies\b/i,
  /\bsubscribe\b.{0,40}\b(magazine|newsletter)\b/i,
  /\bregister (for|now)\b/i,
  /\bnominate (a |now)\b/i,
  /\bupcoming (webinar|event|summit)\b/i,
];

export function isChromePassage(text: string): boolean {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  if (CHROME_PHRASES.some((phrase) => normalized.includes(phrase))) {
    return true;
  }
  return CHROME_PATTERNS.some((pattern) => pattern.test(normalized));
}

const OUTLINE_HEADING =
  /\b[12]\s+samuel\s+\d+\s*[-–]\s*\d+\s*:/gi;

export function isOutlineOrIndexPassage(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  const headingHits = [...normalized.matchAll(OUTLINE_HEADING)];
  if (headingHits.length >= 2) return true;
  if (/\bkey information and resources\b/i.test(normalized)) return true;
  if (
    /\b(breadcrumb|jump to( section)?|in this guide|section index)\b/i.test(
      normalized,
    )
  ) {
    return true;
  }
  if (
    /^part (one|two|three|\d+)\b/i.test(normalized) &&
    normalized.split(/\s+/).length < 40
  ) {
    return true;
  }
  return false;
}
