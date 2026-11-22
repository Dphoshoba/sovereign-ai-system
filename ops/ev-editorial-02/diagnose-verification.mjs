/**
 * EV-EDITORIAL-02 Phase 1 — read-only diagnosis of verification classification.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { createClient } from "@supabase/supabase-js"

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

const { contentFetcher } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/content-fetcher.ts")).href,
)
const { extractArticleClaims, FACTUAL_CLAIM_CEILING } = await import(
  pathToFileURL(
    join(process.cwd(), "lib/research/article-claim-extractor.ts"),
  ).href,
)
const { extractArticleSourceLinks } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/article-source-links.ts"))
    .href,
)
const { collectBoundedBatchEvidence } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/evidence-registry.ts")).href,
)
const { groundedFactVerification } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/claim-evidence-matcher.ts"))
    .href,
)
const { consensusEngine } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/consensus-engine.ts")).href,
)
const {
  resolveClaimSourceBinding,
  evidenceCorroborationKey,
  claimAllowsEvidence,
} = await import(
  pathToFileURL(
    join(process.cwd(), "lib/research/claim-source-attribution.ts"),
  ).href,
)

const RULE =
  "verified iff supporting corroboration keys >= 2 OR (keys >= 1 AND supporting URL matches /\\.gov|nist\\.gov/i); else 1 key => partially verified; 0 => unverified"

const env = loadEnv()
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const IDS = [
  {
    id: "cmwretawd000008jmpj176ufm",
    key: "A",
  },
  {
    id: "cmwreucq1000908jmmm53chtu",
    key: "B",
  },
  {
    id: "cmwrevh7j000i08jmldtvmtxx",
    key: "C",
  },
]

const probeUrls = [
  "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
  "https://www.nist.gov/itl/ai-risk-management-framework",
  "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
  "https://www.biblegateway.com/passage/?search=Philippians%204&version=KJV",
  "https://biblehub.com/esv/philippians/4.htm",
  "https://www.biblegateway.com/passage/?search=Colossians%203%3A23-24&version=ESV",
  "https://biblehub.com/esv/colossians/3.htm",
]

const fetchProbes = []
for (const url of probeUrls) {
  const f = await contentFetcher(url, url)
  fetchProbes.push({
    url,
    status: f.fetchStatus,
    kind: f.contentKind || null,
    chars: (f.extractedText || "").length,
    category: f.diagnostic?.category || null,
    preview: String(f.extractedText || "")
      .replace(/\s+/g, " ")
      .slice(0, 220),
  })
}

const articlesOut = []
for (const item of IDS) {
  const { data: article } = await supabase
    .from("Article")
    .select("*")
    .eq("id", item.id)
    .single()
  const { data: sources } = await supabase
    .from("ResearchSource")
    .select("*")
    .eq("articleId", item.id)
  const { data: audits } = await supabase
    .from("ArticleResearchAudit")
    .select(
      "id, createdAt, publicationRecommendation, consensusScore, sourceQualityScore, verifiedCount, partiallyVerifiedCount, unverifiedCount, factCount, sourceCount, evidenceCount",
    )
    .eq("articleId", item.id)
    .order("createdAt", { ascending: false })
    .limit(1)

  const linked = extractArticleSourceLinks({
    content: article.content,
    excerpt: article.excerpt,
    featuredImage: article.featuredImage,
    researchSources: sources || [],
  })
  const claims = extractArticleClaims({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    factualClaimLimit: FACTUAL_CLAIM_CEILING,
  })
  const listed = linked.map((s) => ({ url: s.url, title: s.title }))

  const claimBindings = claims.claims.map((c) => {
    const binding = resolveClaimSourceBinding(c.claim, listed)
    return {
      claim: c.claim.slice(0, 160),
      binding,
      allows: listed.map((s) => ({
        title: s.title,
        url: s.url,
        allows: claimAllowsEvidence(c.claim, s, listed),
        key: evidenceCorroborationKey(c.claim, s, listed),
      })),
    }
  })

  const evidence = await collectBoundedBatchEvidence(article.title, linked, {
    claimTexts: claims.claims.map((c) => c.claim),
    listedSources: listed,
  })
  const verification = groundedFactVerification(
    claims.claims,
    evidence.evidence,
    claims.normalizedArticleText,
    listed,
  )
  const consensus = consensusEngine(verification.facts)

  articlesOut.push({
    key: item.key,
    id: item.id,
    title: article.title,
    status: article.status,
    latestPersistedAudit: audits?.[0] || null,
    sourceRows: (sources || []).map((s) => ({
      title: s.title,
      url: s.url,
      authorityScore: s.authorityScore,
    })),
    claimCount: claims.claimCount,
    claimBindings,
    acquisition: evidence.sourceDiagnostics,
    evidenceCount: evidence.evidenceCount,
    facts: verification.facts.map((f) => ({
      claim: f.claim.slice(0, 160),
      verificationStatus: f.verificationStatus,
      verificationCount: f.verificationCount,
      verificationMethod: f.verificationMethod,
      verificationScore: f.verificationScore,
      supportingSources: f.supportingSources,
      sourceUrl: f.sourceUrl,
      hasGovSupporting: /\.gov|nist\.gov/i.test(
        (f.supportingSources || []).map((s) => s.sourceUrl).join(" "),
      ),
    })),
    liveVerification: {
      verifiedCount: verification.verifiedCount,
      partiallyVerifiedCount: verification.partiallyVerifiedCount,
      unverifiedCount: verification.unverifiedCount,
      averageVerificationScore: verification.averageVerificationScore,
    },
    liveConsensus: {
      consensusScore: consensus.consensusScore,
      sourceQualityScore: consensus.sourceQualityScore,
      publicationRecommendation: consensus.publicationRecommendation,
      groups: consensus.consensusGroups.map((g) => ({
        theme: g.theme,
        sourceCount: g.sourceCount,
        sourceQualityScore: g.sourceQualityScore,
        factCount: g.facts.length,
      })),
    },
  })
}

const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  classificationRule: RULE,
  diagnosisSummary: {
    structural:
      "Single-host / single-corroboration-key support cannot reach verified unless the supporting URL is government (.gov / nist.gov). This is encoded in groundedFactVerification, not a random defect.",
    articleA:
      "Scripture claims match Bible Gateway but remain partially verified because verificationCount=1 and source is not government. Source quality averages authority of accepted URLs; single BG host yields low group source quality.",
    articleB:
      "OpenAI/IFCN single-source matches are correctly partial. NIST HTML overview extracts only a short teaser (~195 chars) so claim-relevant passages are rejected (extraction failure), leaving NIST unverified despite being the government path that could unlock verified status.",
    articleC:
      "Same structural single-source scripture partial pattern as A; interpretive/devotional sentences are authorial and not scored as factual claims.",
  },
  fetchProbes,
  articles: articlesOut,
}

mkdirSync(join("ops", "ev-editorial-02", "var"), { recursive: true })
writeFileSync(
  join("ops", "ev-editorial-02", "var", "diagnosis.json"),
  JSON.stringify(report, null, 2),
)
console.log(
  JSON.stringify(
    {
      ok: true,
      rule: RULE,
      fetchProbes: fetchProbes.map((p) => ({
        url: p.url,
        status: p.status,
        kind: p.kind,
        chars: p.chars,
      })),
      articles: articlesOut.map((a) => ({
        key: a.key,
        persisted: a.latestPersistedAudit,
        live: {
          ...a.liveVerification,
          ...a.liveConsensus,
        },
        factStatuses: a.facts.map((f) => f.verificationStatus),
        acquisitionCategories: (a.acquisition || []).map((d) => ({
          sourceId: d.sourceId,
          category: d.category,
          chars: d.extractedCharacterCount,
        })),
      })),
    },
    null,
    2,
  ),
)
