export const ARTICLE_2_TITLE =
  "AI as Business Infrastructure for Founders, Ministries, and Teams";

export const ARTICLE_2_EXCERPT =
  "Founders and ministry teams can treat AI as operating infrastructure when governance stays in the workflow.";

export const ARTICLE_2_BODY = [
  "## From creator tools to organizational infrastructure",
  "That can be useful, but it is not infrastructure.",
  "This article takes the next step for teams that already use isolated tools.",
  "AI should be treated as business infrastructure rather than as a collection of isolated tools.",
  "AI risk management should be integrated into broader enterprise risk processes.",
  "A CDO-style knowledge layer can help organizations reuse decisions without replacing human review.",
  "Deloitte reports that enterprise AI applications are moving from pilots into production.",
  "See [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) and [PwC 2026](https://www.pwc.com/ai-predictions).",
  "Also see the [Deloitte survey](https://www.deloitte.com/ai-survey) and [CDO Magazine](https://www.cdomagazine.tech/knowledge-layer).",
].join("\n\n");

export const NIST_PDF_PASSAGE =
  "AI risk management should be integrated into broader enterprise risk processes and treated as an ongoing organizational capability.";

export const PWC_HTML_PASSAGE =
  "Leaders should treat AI as business infrastructure rather than a collection of isolated tools when they plan 2026 operating models.";

export const DELOITTE_SURVEY_PASSAGE =
  "Deloitte reports that enterprise AI applications are moving from pilots into production, while also warning that workload and operational complexity rise as organizations scale.";

export const CDO_KNOWLEDGE_PASSAGE =
  "A CDO-style knowledge layer can help organizations reuse decisions without replacing human review while automating recurring knowledge work.";

export const DELOITTE_CHROME_HTML = `<!doctype html>
<html>
  <head><title>Deloitte | Global CDO Survey</title></head>
  <body>
    <nav>Main navigation Home Insights Events Register now Nominate now</nav>
    <header>Skip to main content Please enable JavaScript to continue</header>
    <aside>Related content Latest insights Subscribe to our newsletter Cookie settings</aside>
    <footer>All rights reserved Event registration Content performance insights Formatting and repurposing Audience engagement</footer>
  </body>
</html>`;

export const DELOITTE_ARTICLE_HTML = `<!doctype html>
<html>
  <head><title>Deloitte AI infrastructure survey</title></head>
  <body>
    <nav>Main navigation Home Insights Register now</nav>
    <header>Skip to main content Please enable JavaScript Cookie settings</header>
    <article>
      <h1>Enterprise AI infrastructure survey</h1>
      <p>${DELOITTE_SURVEY_PASSAGE}</p>
    </article>
    <aside>Related insights Subscribe to our newsletter</aside>
    <footer>All rights reserved Event registration</footer>
  </body>
</html>`;

export const CDO_CHROME_HTML = `<!doctype html>
<html>
  <head><title>CDO Magazine</title></head>
  <body>
    <nav>Magazine Menu Home About Subscribe Sign in</nav>
    <p>Please enable JavaScript</p>
    <p>Related content for audience engagement and content performance insights.</p>
    <footer>All rights reserved Cookie policy</footer>
  </body>
</html>`;

export const CDO_ARTICLE_HTML = `<!doctype html>
<html>
  <head><title>CDO Magazine knowledge layer</title></head>
  <body>
    <nav>Magazine Menu Subscribe Sign in</nav>
    <article>
      <h1>Why the knowledge layer matters</h1>
      <p>${CDO_KNOWLEDGE_PASSAGE}</p>
    </article>
    <footer>All rights reserved Cookie policy</footer>
  </body>
</html>`;

export const PWC_ARTICLE_HTML = `<!doctype html>
<html>
  <head><title>PwC 2026 AI predictions</title></head>
  <body>
    <nav>Skip to main content Main navigation</nav>
    <article>
      <h1>2026 AI predictions</h1>
      <p>${PWC_HTML_PASSAGE}</p>
    </article>
    <footer>All rights reserved Subscribe to our newsletter</footer>
  </body>
</html>`;

export const ARTICLE_2_FIVE_LAYER_MODEL =
  "Echoes & Visions’ strategic framework: A useful AI operating layer has five parts—context and memory, orchestration, human approval, measurement, and audit and learning.";

export const ARTICLE_2_SYNTHESIS_DISCLAIMER =
  "This five-layer model is our synthesis for practical organizational design, not a standard issued by NIST or another source.";

export const ARTICLE_2_WORKING_DEFINITION =
  "For this article, AI business infrastructure means a repeatable, governed layer that helps an organization move work from intake to outcome while preserving human authority.";

export const ARTICLE_2_RECOMMENDATION =
  "Start with one recurring, bounded process: incoming enquiries and follow-up.";

export const ARTICLE_2_CLASSIFICATION_BODY = [
  ARTICLE_2_FIVE_LAYER_MODEL,
  ARTICLE_2_SYNTHESIS_DISCLAIMER,
  ARTICLE_2_WORKING_DEFINITION,
  ARTICLE_2_RECOMMENDATION,
  "NIST’s AI Risk Management Framework says AI risk management should be integrated into broader enterprise risk processes.",
  DELOITTE_SURVEY_PASSAGE,
].join("\n\n");

export const CDO_DRUPAL_HTML = `<!doctype html>
<html>
  <head><title>CDO Magazine knowledge layer</title></head>
  <body>
    <div class="related-articles-wrap social-share-bar">
      <nav>Magazine Menu Subscribe Sign in</nav>
      <div class="node node-article">
        <div class="field field--name-body">
          <h1>Why the knowledge layer matters</h1>
          <p>${CDO_KNOWLEDGE_PASSAGE}</p>
        </div>
      </div>
      <footer>All rights reserved Cookie policy</footer>
    </div>
  </body>
</html>`;

export const CREATOR_TEMPLATE_STRINGS = [
  "content performance insights",
  "formatting and repurposing",
  "audience engagement",
];

import { PDFDocument, StandardFonts } from "pdf-lib";

export async function buildUncompressedPdf(text: string): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const font = await document.embedFont(StandardFonts.Helvetica);
  page.drawText(text, {
    x: 48,
    y: 720,
    size: 11,
    font,
    maxWidth: 516,
    lineHeight: 14,
  });
  return document.save();
}

export async function buildLargeNistStylePdf(
  text: string,
  minBytes = 1_946_127,
): Promise<Uint8Array> {
  const base = Buffer.from(await buildUncompressedPdf(text));
  if (base.byteLength >= minBytes) return new Uint8Array(base);
  const padding = Buffer.alloc(minBytes - base.byteLength, 0x20);
  return new Uint8Array(Buffer.concat([base, Buffer.from("\n"), padding]));
}

export function buildEncryptedPdf(): Uint8Array {
  const body = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R /Encrypt 3 0 R >> endobj
2 0 obj << /Type /Pages /Kids [4 0 R] /Count 1 >> endobj
3 0 obj << /Filter /Standard /V 1 /R 2 /O (xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx) /U (xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx) /P -4 >> endobj
4 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
trailer << /Root 1 0 R /Encrypt 3 0 R >>
%%EOF
`;
  return new Uint8Array(Buffer.from(body, "latin1"));
}

export function buildMalformedPdf(): Uint8Array {
  return new Uint8Array(Buffer.from("%PDF-1.4\nthis is not a valid pdf body", "latin1"));
}

export const GROUNDED_ARTICLE_CLAIM =
  "Responsible governance remains essential for trustworthy publishing when teams use artificial intelligence.";

export const GROUNDED_EVIDENCE_TEXT =
  "Responsible governance remains essential for trustworthy publishing when teams use artificial intelligence. A government research report shows that AI risk management should be integrated into broader enterprise risk processes.";
