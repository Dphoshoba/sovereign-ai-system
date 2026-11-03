import { describe, expect, it } from "vitest";
import { passageSupportsClaim } from "../../lib/research/article-claim-extractor";
import { contentFetcher } from "../../lib/research/content-fetcher";
import { extractHtmlDocument } from "../../lib/research/html-text-extractor";
import { PWC_ARTICLE_HTML, PWC_HTML_PASSAGE } from "../fixtures/research-audit/article-2";

const ARTICLE_BODY =
  "Xero's JAX help page says no customer data is used and the model cannot process it unless the user sends a message.";
const SOURCE_URL = "https://central.xero.com/s/article/About-Just-Ask-Xero-JAX";

function page(jsonLd: string, body = ""): string {
  const safeJsonLd = jsonLd.replace(/</g, "\\u003c");
  return `<!doctype html>
<html>
  <head>
    <title>About Just Ask Xero JAX</title>
    <script type="application/ld+json">${safeJsonLd}</script>
    <script>window.__CONFIG__ = { apiBase: "/0/webruntime/api", routes: ["login"] };</script>
  </head>
  <body>
    <nav>Main navigation Sign in</nav>
    <p>Please enable JavaScript</p>
    <p>Accept all cookies</p>
    ${body}
  </body>
</html>`;
}

const PUBLIC_LOOKUP = async () => [{ address: "93.184.216.34", family: 4 }];

describe("schema.org articleBody extraction", () => {
  it("uses Article.articleBody when the HTML shell has no article text", () => {
    const extracted = extractHtmlDocument(
      page(
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "About JAX",
          publisher: {
            "@type": "Organization",
            name: "Xero",
            url: "https://example.invalid/publisher",
          },
          mainEntityOfPage: "https://example.invalid/other-page",
          articleBody: `<p>${ARTICLE_BODY}</p><script>window.__CONFIG__ = { secret: true };</script>`,
        }),
      ),
    );

    expect(extracted.title).toBe("About Just Ask Xero JAX");
    expect(extracted.extractedText).toContain(ARTICLE_BODY);
    expect(extracted.extractedText).not.toMatch(/webruntime|example\.invalid|accept all cookies/i);
    expect(
      passageSupportsClaim(ARTICLE_BODY, extracted.extractedText, { documentKind: "html" }),
    ).toBe(true);
  });

  it("reads an Article node nested in @graph", () => {
    const extracted = extractHtmlDocument(
      page(
        JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: "Xero", description: "A".repeat(120) },
            {
              "@type": "https://schema.org/Article",
              articleBody: ARTICLE_BODY,
            },
          ],
        }),
      ),
    );
    expect(extracted.extractedText).toContain(ARTICLE_BODY);
  });

  it("leaves the result empty when articleBody is missing", () => {
    const extracted = extractHtmlDocument(
      page(JSON.stringify({ "@type": "Article", headline: "About JAX" })),
    );
    expect(extracted.extractedText).toBe("");
  });

  it("ignores malformed JSON-LD", () => {
    const extracted = extractHtmlDocument(page("{not json"));
    expect(extracted.extractedText).toBe("");
  });

  it("ignores non-Article JSON-LD", () => {
    const extracted = extractHtmlDocument(
      page(
        JSON.stringify({
          "@type": "WebSite",
          description: ARTICLE_BODY,
          articleBody: ARTICLE_BODY,
        }),
      ),
    );
    expect(extracted.extractedText).toBe("");
  });

  it("keeps an application shell empty when no Article body is present", () => {
    const extracted = extractHtmlDocument(`<!doctype html>
<html>
  <head>
    <title>Xero Central</title>
    <script>window.__CONFIG__ = { apiBase: "/0/webruntime/api" };</script>
  </head>
  <body><div id="root"></div></body>
</html>`);
    expect(extracted.extractedText).toBe("");
  });

  it("rejects navigation and cookie text in articleBody", () => {
    const extracted = extractHtmlDocument(
      page(
        JSON.stringify({
          "@type": "Article",
          articleBody:
            "Accept all cookies. Main navigation. Sign in. Please enable JavaScript to continue.",
        }),
      ),
    );
    expect(extracted.extractedText).toBe("");
  });

  it("rejects an articleBody below 80 characters", () => {
    const extracted = extractHtmlDocument(
      page(JSON.stringify({ "@type": "Article", articleBody: "JAX is a help assistant." })),
    );
    expect(extracted.extractedText).toBe("");
  });

  it("preserves an existing HTML article instead of replacing it with JSON-LD", () => {
    const extracted = extractHtmlDocument(PWC_ARTICLE_HTML);
    expect(extracted.extractedText).toContain(PWC_HTML_PASSAGE);
    const mixed = extractHtmlDocument(
      PWC_ARTICLE_HTML.replace(
        "</head>",
        `<script type="application/ld+json">${JSON.stringify({
          "@type": "Article",
          articleBody: ARTICLE_BODY,
        })}</script></head>`,
      ),
    );
    expect(mixed.extractedText).toContain(PWC_HTML_PASSAGE);
    expect(mixed.extractedText).not.toContain(ARTICLE_BODY);
  });
});

describe("JSON-LD fetch provenance", () => {
  it("keeps the fetched URL and records an empty shell as html_extraction_empty", async () => {
    const shell = await contentFetcher(SOURCE_URL, "Xero JAX", {
      lookup: PUBLIC_LOOKUP,
      fetch: (async () =>
        new Response(`<html><head><title>Xero Central</title></head><body><div id="root"></div></body></html>`, {
          status: 200,
          headers: { "content-type": "text/html" },
        })) as typeof fetch,
    });
    expect(shell.url).toBe(SOURCE_URL);
    expect(shell.extractedText).toBe("");
    expect(shell.diagnostic.category).toBe("html_extraction_empty");

    const fetched = await contentFetcher(SOURCE_URL, "Xero JAX", {
      lookup: PUBLIC_LOOKUP,
      fetch: (async () =>
        new Response(
          page(
            JSON.stringify({
              "@type": "Article",
              publisher: { "@type": "Organization", url: "https://example.invalid/publisher" },
              articleBody: ARTICLE_BODY,
            }),
          ),
          { status: 200, headers: { "content-type": "text/html" } },
        )) as typeof fetch,
    });
    expect(fetched.url).toBe(SOURCE_URL);
    expect(fetched.fetchStatus).toBe("success");
    expect(fetched.extractedText).toContain(ARTICLE_BODY);
    expect(fetched.extractedText).not.toMatch(/example\.invalid|webruntime/i);
    expect(fetched.diagnostic.category).toBe("accepted");
  });
});
