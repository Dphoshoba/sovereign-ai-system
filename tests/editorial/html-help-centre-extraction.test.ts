import { describe, expect, it } from "vitest";
import { extractHtmlDocument } from "../../lib/research/html-text-extractor";

const ZAPIER_PROMO_ALERT =
  "On a paid plan? Book a free live session with a Zapier expert for help building your first Next Gen Zap →";

const ZAPIER_BODY_PARAGRAPH =
  "ChatGPT and Zapier work together to automate tasks, using triggers from other apps. You can use this integration to analyze text, generate content, summarize information, and write emails automatically.";

const ZAPIER_CONVERSATION_GUIDANCE =
  "Conversation - (Recommended) Send a chat to OpenAI, optionally storing messages for continuous conversation. Prefer Conversation for new workflows unless you have a specific reason to use Send Prompt.";

function zapierHelpCentreHtml(): string {
  return `<!doctype html>
<html>
  <head><title>How to get started with ChatGPT (OpenAI) on Zapier – Zapier</title></head>
  <body>
    <header>Zapier Help Centre</header>
    <article class="css-cufqof-Alert--mini--info--shadowed">
      <p>${ZAPIER_PROMO_ALERT}</p>
    </article>
    <main>
      <div class="lt-article-container__column lt-article-container__article">
        <div class="lt-pt-4 lt-pb-4 lt-article__box">
          <div class="lt-article__body" itemprop="articleBody">
            <h1>How to get started with ChatGPT (OpenAI) on Zapier</h1>
            <p>${ZAPIER_BODY_PARAGRAPH}</p>
            <h2>Choose the right OpenAI action</h2>
            <p>${ZAPIER_CONVERSATION_GUIDANCE}</p>
            <ul>
              <li>Connect your OpenAI API account before activating the Zap.</li>
              <li>Treat Send Prompt as a completion-style alternative for older models.</li>
            </ul>
            <table>
              <tr><th>Action</th><th>Notes</th></tr>
              <tr><td>Conversation</td><td>Recommended action powered by OpenAI Responses API for structured prompts.</td></tr>
              <tr><td>Send Prompt</td><td>Legacy completion-style alternative for older models.</td></tr>
            </table>
          </div>
        </div>
      </div>
    </main>
    <footer>Copyright Zapier</footer>
  </body>
</html>`;
}

describe("help-centre HTML body extraction", () => {
  it("skips sparse promo <article> alerts and recovers Zapier lt-article body text", () => {
    const extracted = extractHtmlDocument(zapierHelpCentreHtml());

    expect(extracted.extractedText).not.toBe(ZAPIER_PROMO_ALERT);
    expect(extracted.extractedText).not.toContain(ZAPIER_PROMO_ALERT);
    expect(extracted.extractedText).toContain(ZAPIER_BODY_PARAGRAPH);
    expect(extracted.extractedText).toContain("Conversation - (Recommended)");
    expect(extracted.extractedText).toContain("OpenAI Responses API");
    expect(extracted.extractedText).toContain("Send Prompt");
    expect(extracted.extractedText).toMatch(/\bConversation\b/);
    expect(extracted.extractedText.length).toBeGreaterThan(400);
  });
});
