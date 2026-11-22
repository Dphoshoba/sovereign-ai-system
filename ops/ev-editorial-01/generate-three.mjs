/**
 * EV-EDITORIAL-01 — create three review-required articles via Production
 * authorised workflow: POST /api/ai/generate-article (cron auth).
 * Does not publish, approve, schedule, or trigger social.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

function loadEnv() {
  const out = {}
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue
    const i = line.indexOf("=")
    if (i < 1) continue
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[line.slice(0, i).trim()] = v
  }
  return out
}

const TOPICS = [
  {
    key: "biblical",
    category: "bible-stories",
    topic:
      "When Peace Guards Your Mind: A Careful Reading of Philippians 4:4-9 for Anxious Days",
    audienceValue:
      "Helps believers handle anxiety with Scripture carefully read—not as self-help slogans—and with practical prayer and thought habits grounded in the passage.",
    manualSources: [
      {
        title: "Philippians 4 (ESV) — Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
        sourceType: "primary-scripture",
        authorityScore: 95,
        trustScore: 95,
      },
      {
        title: "Philippians 4 (NIV) — Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=NIV",
        sourceType: "primary-scripture",
        authorityScore: 90,
        trustScore: 90,
      },
      {
        title:
          "APA — Anxiety disorders overview (general mental-health context; not a biblical commentary)",
        url: "https://www.apa.org/topics/anxiety",
        sourceType: "secondary-context",
        authorityScore: 80,
        trustScore: 80,
      },
    ],
  },
  {
    key: "ai",
    category: "ai-tools",
    topic:
      "How to Fact-Check an AI Draft Before You Hit Publish: A Practical Habit for Creators and Ministries",
    audienceValue:
      "Gives creators and ministry communicators a concrete pre-publish checklist so AI speed does not become published error, without rejecting AI as a drafting aid.",
    manualSources: [
      {
        title: "NIST AI Risk Management Framework (AI RMF 1.0)",
        url: "https://www.nist.gov/itl/ai-risk-management-framework",
        sourceType: "primary-standard",
        authorityScore: 95,
        trustScore: 95,
      },
      {
        title: "OpenAI — Usage policies (accuracy and safety responsibilities)",
        url: "https://openai.com/policies/usage-policies",
        sourceType: "vendor-policy",
        authorityScore: 70,
        trustScore: 70,
      },
      {
        title: "IFCN — Code of Principles (fact-checking standards overview)",
        url: "https://ifcncodeofprinciples.poynter.org/know-more/the-commitments-of-the-code-of-principles",
        sourceType: "secondary-standard",
        authorityScore: 85,
        trustScore: 85,
      },
    ],
  },
  {
    key: "growth",
    category: "motivation",
    topic:
      "Faithful in Ordinary Work: Finding Purpose When Your Role Feels Small",
    audienceValue:
      "Encourages readers who feel overlooked to practise faithfulness in ordinary responsibilities, distinguishing biblical vocation from career hype.",
    manualSources: [
      {
        title: "Colossians 3:23–24 (ESV) — Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=Colossians%203%3A23-24&version=ESV",
        sourceType: "primary-scripture",
        authorityScore: 95,
        trustScore: 95,
      },
      {
        title: "1 Thessalonians 4:11–12 (ESV) — Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=1%20Thessalonians%204%3A11-12&version=ESV",
        sourceType: "primary-scripture",
        authorityScore: 95,
        trustScore: 95,
      },
      {
        title:
          "APA — Purpose in life / meaning (psychological context; not theology)",
        url: "https://www.apa.org/monitor/2014/10/cover-purpose",
        sourceType: "secondary-context",
        authorityScore: 75,
        trustScore: 75,
      },
    ],
  },
]

const env = loadEnv()
const key = env.CRON_SECRET
if (!key) {
  console.log(JSON.stringify({ ok: false, error: "CRON_SECRET_missing" }))
  process.exit(1)
}

const outDir = join("ops", "ev-editorial-01", "var")
mkdirSync(outDir, { recursive: true })

const results = []
for (const item of TOPICS) {
  console.error(`Generating: ${item.key}…`)
  const started = Date.now()
  try {
    const res = await fetch(
      "https://www.echoesandvisions.com/api/ai/generate-article",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          topic: item.topic,
          category: item.category,
          manualSources: item.manualSources,
        }),
      },
    )
    const text = await res.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text.slice(0, 500) }
    }
    const summary = {
      key: item.key,
      topicRequested: item.topic,
      category: item.category,
      audienceValue: item.audienceValue,
      httpStatus: res.status,
      durationMs: Date.now() - started,
      ok: Boolean(body?.ok),
      articleId: body?.article?.id || body?.id || null,
      title: body?.article?.title || null,
      slug: body?.article?.slug || null,
      status: body?.article?.status || null,
      editorialScore: body?.article?.editorialScore ?? null,
      editorialGrade: body?.article?.editorialGrade ?? null,
      qualityScore: body?.article?.qualityScore ?? null,
      qualityGrade: body?.article?.qualityGrade ?? null,
      seoScore: body?.article?.seoScore ?? null,
      seoGrade: body?.article?.seoGrade ?? null,
      review: body?.review
        ? {
            ok: body.review.ok,
            code: body.review.code || null,
            recommendation: body.review.recommendation || null,
            consensusScore: body.review.consensusScore ?? null,
            sourceQualityScore: body.review.sourceQualityScore ?? null,
            error: body.review.error || null,
          }
        : null,
      error: body?.error || null,
      editUrl: body?.article?.id
        ? `https://www.echoesandvisions.com/admin/articles/${body.article.id}/edit`
        : null,
      auditUrl: body?.article?.id
        ? `https://www.echoesandvisions.com/admin/articles/${body.article.id}/audit`
        : null,
    }
    results.push(summary)
    writeFileSync(
      join(outDir, `${item.key}-result.json`),
      JSON.stringify({ summary, bodyKeys: Object.keys(body || {}) }, null, 2),
    )
  } catch (error) {
    results.push({
      key: item.key,
      ok: false,
      error: String(error?.message || error),
      durationMs: Date.now() - started,
    })
  }
}

const report = {
  ok: results.every((r) => r.ok && r.articleId && r.status === "review-required"),
  generatedAt: new Date().toISOString(),
  results,
}
writeFileSync(join(outDir, "batch-result.json"), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 2)
