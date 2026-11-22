import { pathToFileURL } from "node:url"
import { join } from "node:path"

const { contentFetcher } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/content-fetcher.ts")).href,
)
const { groundedFactVerification } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/claim-evidence-matcher.ts"))
    .href,
)
const { collectBoundedBatchEvidence } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/evidence-registry.ts")).href,
)
const { consensusEngine } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/consensus-engine.ts")).href,
)
const { scoreAuthority, scoreTrust } = await import(
  pathToFileURL(join(process.cwd(), "lib/research/source-collector.ts")).href,
)
const { extractArticleClaims, FACTUAL_CLAIM_CEILING } = await import(
  pathToFileURL(
    join(process.cwd(), "lib/research/article-claim-extractor.ts"),
  ).href,
)

const claim =
  'According to the biblical text of Philippians chapter four in the English Standard Version, "Rejoice in the Lord always; again I will say, rejoice."'

const article = {
  title: "Probe",
  excerpt: claim,
  content: `## Probe\n\n${claim}\n`,
}

const sources = [
  {
    title: "Philippians 4 (ESV) — Bible Gateway",
    url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
    sourceType: "primary-scripture",
    authorityScore: scoreAuthority(
      "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
    ),
    trustScore: scoreTrust(
      "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
    ),
    relevanceScore: 80,
  },
  {
    title: "Philippians 4 (ESV) — Bible Hub",
    url: "https://biblehub.com/esv/philippians/4.htm",
    sourceType: "primary-scripture",
    authorityScore: scoreAuthority("https://biblehub.com/esv/philippians/4.htm"),
    trustScore: scoreTrust("https://biblehub.com/esv/philippians/4.htm"),
    relevanceScore: 80,
  },
]

const claims = extractArticleClaims({
  ...article,
  factualClaimLimit: FACTUAL_CLAIM_CEILING,
})
const evidence = await collectBoundedBatchEvidence(article.title, sources, {
  claimTexts: claims.claims.map((c) => c.claim),
  listedSources: sources.map((s) => ({ url: s.url, title: s.title })),
})
const verification = groundedFactVerification(
  claims.claims,
  evidence.evidence,
  claims.normalizedArticleText,
  sources.map((s) => ({ url: s.url, title: s.title })),
)
const consensus = consensusEngine(verification.facts)

console.log(
  JSON.stringify(
    {
      authority: sources.map((s) => ({
        url: s.url,
        authorityScore: s.authorityScore,
        trustScore: s.trustScore,
      })),
      claimCount: claims.claimCount,
      claims: claims.claims.map((c) => c.claim),
      acquisition: evidence.sourceDiagnostics,
      facts: verification.facts.map((f) => ({
        status: f.verificationStatus,
        count: f.verificationCount,
        supporting: f.supportingSources,
      })),
      consensus: {
        consensusScore: consensus.consensusScore,
        sourceQualityScore: consensus.sourceQualityScore,
        recommendation: consensus.publicationRecommendation,
      },
    },
    null,
    2,
  ),
)
