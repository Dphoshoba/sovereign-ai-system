/**
 * EV-EDITORIAL-02 — apply evidence remediation + fresh prepareArticleForReview.
 * Keeps status review-required. Does not approve/schedule/publish.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { spawnSync } from "node:child_process"

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

function makeId() {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`
}

function loadMd(name) {
  return readFileSync(join("ops", "ev-editorial-02", "var", name), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/\u2013|\u2014/g, "-")
    .trim()
}

const ARTICLES = [
  {
    id: "cmwretawd000008jmpj176ufm",
    key: "A",
    file: "article-a.md",
    excerpt:
      "Philippians 4:4-9 for anxious days: rejoice, pray with thanksgiving, receive guarding peace, practise what is true, and keep pastoral counsel distinct from clinical care.",
    seoTitle: "Philippians 4:4-9 Peace That Guards Your Mind",
    seoDescription:
      "A careful reading of Philippians 4:4-9 for anxious days: rejoicing, prayer, guarding peace, practised obedience, and learned contentment.",
    seoKeywords:
      "Philippians 4:4-9, peace of God guards your mind, Christian help for anxiety, learned contentment Philippians",
    sources: [
      {
        title: "Philippians 4 (ESV) Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
        authorityScore: 80,
        trustScore: 80,
        sourceType: "primary-scripture",
      },
      {
        title: "Philippians 4 (ESV) Bible Hub",
        url: "https://biblehub.com/esv/philippians/4.htm",
        authorityScore: 80,
        trustScore: 80,
        sourceType: "primary-scripture",
      },
    ],
  },
  {
    id: "cmwreucq1000908jmmm53chtu",
    key: "B",
    file: "article-b.md",
    excerpt:
      "A practical pre-publish habit for creators and ministries: fact-check AI drafts with NIST AI RMF, OpenAI responsibility boundaries, and IFCN-style source discipline.",
    seoTitle: "Fact-Check Your AI Draft Before You Publish",
    seoDescription:
      "A six-step habit to fact-check AI drafts before publishing, grounded in NIST AI RMF, OpenAI usage policies, and IFCN source transparency.",
    seoKeywords:
      "fact-check AI draft, responsible AI publishing, NIST AI RMF creators, OpenAI usage policies, IFCN fact-checking",
    sources: [
      {
        title: "NIST AI RMF 1.0 PDF",
        url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
        authorityScore: 100,
        trustScore: 95,
        sourceType: "primary-standard",
      },
      {
        title: "OpenAI Usage policies",
        url: "https://openai.com/policies/usage-policies",
        authorityScore: 85,
        trustScore: 85,
        sourceType: "vendor-policy",
      },
      {
        title: "IFCN Code of Principles commitments",
        url: "https://ifcncodeofprinciples.poynter.org/know-more/the-commitments-of-the-code-of-principles",
        authorityScore: 85,
        trustScore: 85,
        sourceType: "secondary-standard",
      },
    ],
  },
  {
    id: "cmwrevh7j000i08jmldtvmtxx",
    key: "C",
    file: "article-c.md",
    excerpt:
      "When your role feels small, Scripture still calls you to faithfulness. Colossians 3 and 1 Thessalonians 4 reframe ordinary work as service to the Lord without career hype.",
    seoTitle: "Faithful in Ordinary Work When Your Role Feels Small",
    seoDescription:
      "A practical, Scripture-grounded guide to purpose in ordinary work using Colossians 3 and 1 Thessalonians 4 without career hype.",
    seoKeywords:
      "faithful in ordinary work, purpose when role feels small, Colossians 3:23, vocation without career hype",
    sources: [
      {
        title: "Colossians 3 (ESV) Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=Colossians%203%3A23-24&version=ESV",
        authorityScore: 80,
        trustScore: 80,
        sourceType: "primary-scripture",
      },
      {
        title: "Colossians 3 (ESV) Bible Hub",
        url: "https://biblehub.com/esv/colossians/3.htm",
        authorityScore: 80,
        trustScore: 80,
        sourceType: "primary-scripture",
      },
      {
        title: "1 Thessalonians 4 (ESV) Bible Gateway",
        url: "https://www.biblegateway.com/passage/?search=1%20Thessalonians%204%3A11-12&version=ESV",
        authorityScore: 80,
        trustScore: 80,
        sourceType: "primary-scripture",
      },
      {
        title: "1 Thessalonians 4 (ESV) Bible Hub",
        url: "https://biblehub.com/esv/1_thessalonians/4.htm",
        authorityScore: 80,
        trustScore: 80,
        sourceType: "primary-scripture",
      },
    ],
  },
]

const BEFORE = {
  A: { consensus: 50, sourceQuality: 50, recommendation: "review-required", v: 0, p: 4, u: 0 },
  B: { consensus: 68, sourceQuality: 75, recommendation: "review-required", v: 0, p: 4, u: 1 },
  C: { consensus: 50, sourceQuality: 50, recommendation: "review-required", v: 0, p: 2, u: 0 },
}

const env = loadEnv()
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const applyReport = []
for (const item of ARTICLES) {
  const content = loadMd(item.file)
  const before = await supabase
    .from("Article")
    .select("id, status, publishedAt, scheduledFor, approvedAt")
    .eq("id", item.id)
    .single()
  if (!before.data || before.data.status !== "review-required") {
    applyReport.push({
      key: item.key,
      ok: false,
      error: "status_guard",
      status: before.data?.status,
    })
    continue
  }
  if (
    before.data.publishedAt ||
    before.data.scheduledFor ||
    before.data.approvedAt
  ) {
    applyReport.push({ key: item.key, ok: false, error: "lifecycle_guard" })
    continue
  }

  await supabase.from("ArticleResearchAudit").delete().eq("articleId", item.id)
  await supabase.from("ArticleReviewNote").delete().eq("articleId", item.id)
  await supabase.from("ResearchSource").delete().eq("articleId", item.id)

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("Article")
    .update({
      content,
      excerpt: item.excerpt,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      seoKeywords: item.seoKeywords,
      status: "review-required",
      approvedAt: null,
      approvedBy: null,
      publishedAt: null,
      scheduledFor: null,
      editorialScore: null,
      editorialGrade: null,
      editorialWarnings: null,
      qualityScore: null,
      qualityGrade: null,
      seoScore: null,
      seoGrade: null,
      updatedAt: now,
    })
    .eq("id", item.id)

  const rows = item.sources.map((s) => ({
    id: makeId(),
    articleId: item.id,
    title: s.title,
    url: s.url,
    authorityScore: s.authorityScore,
    trustScore: s.trustScore,
    sourceType: s.sourceType,
  }))
  const ins = await supabase.from("ResearchSource").insert(rows)
  applyReport.push({
    key: item.key,
    id: item.id,
    ok: !error && !ins.error,
    error: error?.message || ins.error?.message || null,
    contentChars: content.length,
    sources: rows.length,
  })
}

mkdirSync(join("ops", "ev-editorial-02", "var"), { recursive: true })
writeFileSync(
  join("ops", "ev-editorial-02", "var", "apply.json"),
  JSON.stringify({ applyReport, before: BEFORE }, null, 2),
)
console.log(JSON.stringify({ applyReport }, null, 2))

const prep = spawnSync(
  "npx",
  [
    "tsx",
    "ops/ev-editorial-01/prepare-audits.mjs",
    ...ARTICLES.map((a) => a.id),
  ],
  { cwd: process.cwd(), encoding: "utf8", shell: true, timeout: 300000 },
)
writeFileSync(
  join("ops", "ev-editorial-02", "var", "prepare-stdout.txt"),
  prep.stdout || "",
)
writeFileSync(
  join("ops", "ev-editorial-02", "var", "prepare-stderr.txt"),
  prep.stderr || "",
)
console.log(prep.stdout)
if (prep.stderr) console.error(prep.stderr)
if ((prep.status ?? 1) !== 0) process.exit(prep.status ?? 1)

// Snapshot after
const ids = ARTICLES.map((a) => a.id)
const { data: articles } = await supabase.from("Article").select("*").in("id", ids)
const { data: audits } = await supabase
  .from("ArticleResearchAudit")
  .select(
    "id, articleId, createdAt, publicationRecommendation, consensusScore, sourceQualityScore, verifiedCount, partiallyVerifiedCount, unverifiedCount, factCount, sourceCount, evidenceCount, averageVerificationScore, averageAuthorityScore, averageTrustScore",
  )
  .in("articleId", ids)
  .order("createdAt", { ascending: false })
const { data: sources } = await supabase
  .from("ResearchSource")
  .select("articleId, title, url, authorityScore")
  .in("articleId", ids)

const after = ARTICLES.map((item) => {
  const article = (articles || []).find((a) => a.id === item.id)
  const latest = (audits || []).find((a) => a.articleId === item.id)
  const before = BEFORE[item.key]
  const gatePass =
    latest &&
    latest.publicationRecommendation === "publish-ready" &&
    Number(latest.consensusScore) >= 80 &&
    Number(latest.sourceQualityScore) >= 70
  return {
    key: item.key,
    id: item.id,
    title: article?.title,
    status: article?.status,
    publishedAt: article?.publishedAt,
    scheduledFor: article?.scheduledFor,
    approvedAt: article?.approvedAt,
    scores: {
      editorialScore: article?.editorialScore,
      editorialGrade: article?.editorialGrade,
      qualityScore: article?.qualityScore,
      seoScore: article?.seoScore,
    },
    sources: (sources || []).filter((s) => s.articleId === item.id),
    before,
    after: latest
      ? {
          auditId: latest.id,
          createdAt: latest.createdAt,
          recommendation: latest.publicationRecommendation,
          consensusScore: latest.consensusScore,
          sourceQualityScore: latest.sourceQualityScore,
          verifiedCount: latest.verifiedCount,
          partiallyVerifiedCount: latest.partiallyVerifiedCount,
          unverifiedCount: latest.unverifiedCount,
          factCount: latest.factCount,
          sourceCount: latest.sourceCount,
          evidenceCount: latest.evidenceCount,
        }
      : null,
    gatePass: Boolean(gatePass),
    delta: latest
      ? {
          consensus: latest.consensusScore - before.consensus,
          sourceQuality: latest.sourceQualityScore - before.sourceQuality,
          verified: latest.verifiedCount - before.v,
        }
      : null,
  }
})

const report = {
  ok: after.every((a) => a.after),
  generatedAt: new Date().toISOString(),
  allReviewRequired: after.every((a) => a.status === "review-required"),
  allUnpublished: after.every(
    (a) => !a.publishedAt && !a.scheduledFor && !a.approvedAt,
  ),
  gatePassCount: after.filter((a) => a.gatePass).length,
  articles: after,
}
writeFileSync(
  join("ops", "ev-editorial-02", "var", "reaudit-snapshot.json"),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
