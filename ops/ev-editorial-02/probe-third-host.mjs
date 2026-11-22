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
const { extractArticleClaims, FACTUAL_CLAIM_CEILING } = await import(
  pathToFileURL(
    join(process.cwd(), "lib/research/article-claim-extractor.ts"),
  ).href,
)

const hosts = [
  {
    title: "Philippians 4 (ESV) Bible Gateway",
    url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
  },
  {
    title: "Philippians 4 (ESV) Bible Hub",
    url: "https://biblehub.com/esv/philippians/4.htm",
  },
  {
    title: "Philippians 4 (ESV) Biblica",
    url: "https://www.biblica.com/bible/?osis=ESV:Phil.4.4%E2%80%939",
  },
]

for (const h of hosts) {
  const f = await contentFetcher(h.url, h.title)
  console.log(
    JSON.stringify({
      title: h.title,
      status: f.fetchStatus,
      chars: (f.extractedText || "").length,
      hasRejoice: /Rejoice in the Lord always/i.test(f.extractedText || ""),
      preview: String(f.extractedText || "")
        .replace(/\s+/g, " ")
        .slice(0, 120),
    }),
  )
}

const claimsText = [
  'According to Philippians 4 (ESV) Bible Gateway, "Rejoice in the Lord always; again I will say, rejoice."',
  'According to Philippians 4 (ESV) Bible Hub, "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus."',
  'According to Philippians 4 (ESV) Biblica, "Not that I am speaking of being in need, for I have learned, in whatever situation I am, to be content."',
]

const content = ["## Probe", "", ...claimsText].join("\n\n")
const sources = hosts.map((h) => ({
  ...h,
  sourceType: "primary-scripture",
  authorityScore: 80,
  trustScore: 80,
  relevanceScore: 90,
}))
const listed = sources.map((s) => ({ url: s.url, title: s.title }))
const extracted = extractArticleClaims({
  title: "Probe",
  excerpt: claimsText[0],
  content,
  factualClaimLimit: FACTUAL_CLAIM_CEILING,
})
const evidence = await collectBoundedBatchEvidence("Probe", sources, {
  claimTexts: extracted.claims.map((c) => c.claim),
  listedSources: listed,
})
const verification = groundedFactVerification(
  extracted.claims,
  evidence.evidence,
  extracted.normalizedArticleText,
  listed,
)
const consensus = consensusEngine(verification.facts)
console.log(
  JSON.stringify(
    {
      acquisition: evidence.sourceDiagnostics?.map((d) => ({
        id: d.sourceId,
        category: d.category,
        accepted: d.acceptedPassageCount,
      })),
      facts: verification.facts.map((f) => ({
        status: f.verificationStatus,
        url: f.sourceUrl,
      })),
      consensus: {
        consensusScore: consensus.consensusScore,
        sourceQualityScore: consensus.sourceQualityScore,
        recommendation: consensus.publicationRecommendation,
        groups: consensus.consensusGroups.map((g) => ({
          theme: g.theme,
          sourceCount: g.sourceCount,
        })),
      },
    },
    null,
    2,
  ),
)
