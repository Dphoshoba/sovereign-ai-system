export const ARTICLE_2_TITLE =
  "AI as Business Infrastructure for Founders, Ministries, and Teams";

export const ARTICLE_2_EXCERPT =
  "Founders and ministry teams can treat AI as operating infrastructure when governance stays in the workflow.";

export const ARTICLE_2_BODY = [
  "AI should be treated as business infrastructure rather than as a collection of isolated tools.",
  "AI risk management should be integrated into broader enterprise risk processes.",
  "A CDO-style knowledge layer can help organizations reuse decisions without replacing human review.",
  "See [NIST AI RMF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf), [PwC 2026](https://www.pwc.com/ai-predictions), [Deloitte survey](https://www.deloitte.com/ai-survey), and [CDO Magazine](https://www.cdomagazine.tech/knowledge-layer).",
].join(" ");

export const NIST_PDF_PASSAGE =
  "AI risk management should be integrated into broader enterprise risk processes and treated as an ongoing organizational capability.";

export const PWC_HTML_PASSAGE =
  "Leaders should treat AI as business infrastructure rather than a collection of isolated tools when they plan 2026 operating models.";

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

export const CREATOR_TEMPLATE_STRINGS = [
  "content performance insights",
  "formatting and repurposing",
  "audience engagement",
];

export function buildUncompressedPdf(text: string): Uint8Array {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = `BT /F1 12 Tf 24 720 Td (${escaped}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  const body = `%PDF-1.1\n${objects.join("\n")}\n`;
  return new Uint8Array(Buffer.from(body, "latin1"));
}

export const GROUNDED_ARTICLE_CLAIM =
  "Responsible governance remains essential for trustworthy publishing when teams use artificial intelligence.";

export const GROUNDED_EVIDENCE_TEXT =
  "Responsible governance remains essential for trustworthy publishing when teams use artificial intelligence. A government research report shows that AI risk management should be integrated into broader enterprise risk processes.";
