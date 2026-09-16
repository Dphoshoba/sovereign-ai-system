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
