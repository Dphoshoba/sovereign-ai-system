import { describe, expect, it } from "vitest";
import {
  extractArticleClaims,
  FACTUAL_CLAIM_CEILING,
  hasPublisherAttribution,
} from "../../lib/research/article-claim-extractor";
import {
  claimAllowsEvidence,
  publishersNamedInClaim,
} from "../../lib/research/claim-source-attribution";
import { extractHtmlDocument } from "../../lib/research/html-text-extractor";

const TUTORIAL_BODY = `
## Why start with one workflow?

The US National Institute of Standards and Technology (NIST) identifies risks associated with generative AI, including confidently incorrect information, over-reliance on automated systems and problems involving information integrity.

## Day 2 — Map the workflow

Keeping those decisions with people is a practical response to the over-reliance risks discussed in the NIST Generative AI Profile.

## Choose the right OpenAI action

For outline generation, use Zapier's Conversation action. Zapier marks it as recommended. It is powered by OpenAI's Responses API and supports current GPT models suitable for a single structured prompt.

Treat Send Prompt as a completion-style alternative. Zapier's comparison notes that it targets older completion-oriented models and does not retain conversational context. Prefer Conversation for new workflows unless you have a specific reason to use Send Prompt.

## Avoid obsolete actions

Zapier's older Assistants API-based actions reached their announced end-of-service date on 26 August 2026.
`;

const ZAPIER_SOURCE = {
  url: "https://help.zapier.com/hc/en-us/articles/14860148802829-How-to-get-started-with-ChatGPT-OpenAI-on-Zapier",
  title: "How to get started with ChatGPT (OpenAI) on Zapier",
  publisher: "Zapier",
};

const OPENAI_SOURCE = {
  url: "https://developers.openai.com/api/docs/guides/your-data",
  title: "Data controls in the OpenAI platform",
  publisher: "OpenAI",
};

const NIST_SOURCE = {
  url: "https://nvlpubs.nist.gov/nistpubs/AI/NIST.AI.600-1.pdf",
  title: "NIST Generative AI Profile",
  publisher: "NIST",
};

describe("tutorial claim coverage for Zapier and OpenAI docs", () => {
  it("extracts substantive Zapier, OpenAI and NIST tutorial claims without advice lines", () => {
    const extracted = extractArticleClaims({
      title: "AI Automation for Creators: Build Your First Workflow in 7 Days",
      excerpt:
        "Learn how to build your first AI content automation in seven days using Google Sheets, Zapier and OpenAI.",
      content: TUTORIAL_BODY,
      factualClaimLimit: FACTUAL_CLAIM_CEILING,
    });

    const claims = extracted.claims.map((claim) => claim.claim);
    expect(
      claims.some((claim) =>
        /National Institute of Standards and Technology \(NIST\) identifies risks/i.test(
          claim,
        ),
      ),
    ).toBe(true);
    expect(claims).toContain("Zapier marks it as recommended.");
    expect(
      claims.some((claim) =>
        /comparison notes that it targets older completion-oriented models/i.test(claim),
      ),
    ).toBe(true);
    expect(
      claims.some((claim) =>
        /announced end-of-service date on 26 August 2026/i.test(claim),
      ),
    ).toBe(true);
    expect(
      claims.some(
        (claim) =>
          /Zapier marks it as recommended/i.test(claim) &&
          /Responses API/i.test(claim),
      ),
    ).toBe(true);
    expect(claims.some((claim) => /^Prefer Conversation\b/i.test(claim))).toBe(false);
    expect(claims.some((claim) => /^Treat Send Prompt\b/i.test(claim))).toBe(false);
    expect(
      claims.some((claim) => /practical response to the over-reliance/i.test(claim)),
    ).toBe(false);
    expect(
      extracted.authorialAssertions.some((claim) =>
        /practical response to the over-reliance/i.test(claim.claim),
      ),
    ).toBe(true);
    expect(hasPublisherAttribution("Zapier marks it as recommended.")).toBe(true);
    expect(publishersNamedInClaim("Zapier marks it as recommended.")).toEqual(["zapier"]);
    expect(
      claimAllowsEvidence("Zapier marks it as recommended.", ZAPIER_SOURCE, [
        ZAPIER_SOURCE,
        OPENAI_SOURCE,
        NIST_SOURCE,
      ]),
    ).toBe(true);
    expect(
      claimAllowsEvidence(
        "The US National Institute of Standards and Technology (NIST) identifies risks associated with generative AI.",
        NIST_SOURCE,
        [ZAPIER_SOURCE, OPENAI_SOURCE, NIST_SOURCE],
      ),
    ).toBe(true);
    expect(extracted.claimCount).toBeGreaterThanOrEqual(5);
  });

  it("keeps Zapier promo-alert rejection and short comparison-table labels", () => {
    const html = `<!doctype html><html><body>
      <article class="css-cufqof-Alert--mini--info--shadowed"><p>On a paid plan? Book a free live session with a Zapier expert for help building your first Next Gen Zap →</p></article>
      <main><div class="lt-article__body" itemprop="articleBody">
        <p>ChatGPT and Zapier work together to automate tasks, using triggers from other apps. You can use this integration to analyze text, generate content, summarize information, and write emails automatically.</p>
        <table>
          <tr><th>Action</th><th>Notes</th></tr>
          <tr><td>Conversation</td><td>Recommended action powered by OpenAI Responses API for structured prompts.</td></tr>
          <tr><td>Send Prompt</td><td>Legacy completion-style alternative for older models.</td></tr>
        </table>
      </div></main>
    </body></html>`;
    const extracted = extractHtmlDocument(html);
    expect(extracted.extractedText).not.toContain("Book a free live session");
    expect(extracted.extractedText).toContain("Send Prompt");
    expect(extracted.extractedText).toMatch(/\bConversation\b/);
    expect(extracted.extractedText).toContain("OpenAI Responses API");
  });
});
