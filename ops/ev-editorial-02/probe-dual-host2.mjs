import { pathToFileURL } from "node:url"
import { join } from "node:path"

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
const {
  resolveClaimSourceBinding,
  claimAllowsEvidence,
} = await import(
  pathToFileURL(
    join(process.cwd(), "lib/research/claim-source-attribution.ts"),
  ).href,
)

const claimsText = [
  'According to EV02 Alpha, "Rejoice in the Lord always; again I will say, rejoice."',
  'According to EV02 Alpha, "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus."',
  'According to EV02 Alpha, "Not that I am speaking of being in need, for I have learned, in whatever situation I am, to be content."',
  'According to EV02 Alpha, "And my God will supply every need of yours according to his riches in glory in Christ Jesus."',
]

const content = ["## Probe", "", ...claimsText].join("\n\n")
const sources = [
  {
    title: "Philippians 4 (ESV) — Bible Gateway",
    url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
    sourceType: "primary-scripture",
    authorityScore: 90,
    trustScore: 90,
    relevanceScore: 90,
  },
  {
    title: "Philippians 4 (ESV) — Bible Hub",
    url: "https://biblehub.com/esv/philippians/4.htm",
    sourceType: "primary-scripture",
    authorityScore: 85,
    trustScore: 85,
    relevanceScore: 90,
  },
].map((s) => ({
  ...s,
  authorityScore: s.authorityScore,
  trustScore: s.trustScore,
}))

const listed = sources.map((s) => ({ url: s.url, title: s.title }))
for (const c of claimsText) {
  console.log(
    "binding",
    JSON.stringify({
      claim: c.slice(0, 60),
      binding: resolveClaimSourceBinding(c, listed),
      allows: listed.map((s) => claimAllowsEvidence(c, s, listed)),
    }),
  )
}

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
      extractedClaims: extracted.claims.map((c) => c.claim),
      acquisition: evidence.sourceDiagnostics?.map((d) => ({
        id: d.sourceId,
        category: d.category,
        accepted: d.acceptedPassageCount,
      })),
      facts: verification.facts.map((f) => ({
        status: f.verificationStatus,
        count: f.verificationCount,
        supporting: f.supportingSources?.map((s) => s.sourceUrl),
      })),
      counts: {
        v: verification.verifiedCount,
        p: verification.partiallyVerifiedCount,
        u: verification.unverifiedCount,
      },
      consensus: {
        consensusScore: consensus.consensusScore,
        sourceQualityScore: consensus.sourceQualityScore,
        recommendation: consensus.publicationRecommendation,
      },
      scoredAuthorityDefaults: {
        bg: scoreAuthority(sources[0].url),
        hub: scoreAuthority(sources[1].url),
      },
    },
    null,
    2,
  ),
)
