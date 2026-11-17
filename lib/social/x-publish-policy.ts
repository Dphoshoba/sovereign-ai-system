/** Authorised X account: David O George (@GmDavidoshoba). */
export const AUTHORISED_X_ACCOUNT_ID = "2330006420";

export const CANONICAL_ARTICLE_ORIGIN = "https://www.echoesandvisions.com";

export const X_WEIGHTED_URL_LENGTH = 23;

export const X_MAX_WEIGHTED_LENGTH = 280;

export function canonicalArticleUrl(slug: string): string {
  const normalised = slug.trim().replace(/^\/+|\/+$/g, "");
  return `${CANONICAL_ARTICLE_ORIGIN}/blog/${normalised}`;
}

export function extractHttpUrls(content: string): string[] {
  return [...content.matchAll(/https?:\/\/[^\s<>"']+/gi)].map((match) =>
    match[0].replace(/[),.;!?]+$/g, ""),
  );
}

/**
 * True when content contains a /blog/... URL that is not the canonical
 * public article URL (`/blog/{slug}` with no category segment).
 */
export function hasIncorrectArticleLink(content: string, slug: string): boolean {
  const canonical = canonicalArticleUrl(slug);
  return extractHttpUrls(content).some((url) => {
    try {
      return new URL(url).pathname.startsWith("/blog/") && url !== canonical;
    } catch {
      return false;
    }
  });
}

export function xWeightedLength(content: string): number {
  return extractHttpUrls(content).reduce(
    (weight, url) => weight + X_WEIGHTED_URL_LENGTH - url.length,
    content.length,
  );
}

export function checkArticleLink(
  content: string,
  slug: string,
):
  | { ok: true }
  | { ok: false; code: "missing_canonical_url" | "incorrect_article_link" } {
  const canonical = canonicalArticleUrl(slug);
  const urls = extractHttpUrls(content);
  const hasCanonical = urls.some((url) => url === canonical);
  if (hasIncorrectArticleLink(content, slug)) {
    return { ok: false, code: "incorrect_article_link" };
  }
  if (!hasCanonical) return { ok: false, code: "missing_canonical_url" };
  return { ok: true };
}

export function checkXLength(
  content: string,
): { ok: true } | { ok: false; code: "invalid_length" } {
  const weight = xWeightedLength(content);
  if (weight < 1 || weight > X_MAX_WEIGHTED_LENGTH) {
    return { ok: false, code: "invalid_length" };
  }
  return { ok: true };
}

export function accountMatchesAuthorisedPublisher(id: unknown): boolean {
  return String(id) === AUTHORISED_X_ACCOUNT_ID;
}
