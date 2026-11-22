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
const { extractArticleClaims, FACTUAL_CLAIM_CEILING } = await import(
  pathToFileURL(
    join(process.cwd(), "lib/research/article-claim-extractor.ts"),
  ).href,
)

const claimsText = [
  'According to Philippians 4 (ESV) Bible Gateway, "Rejoice in the Lord always; again I will say, rejoice."',
  'According to Philippians 4 (ESV) Bible Hub, "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus."',
  'According to Philippians 4 (ESV) Bible Gateway, "Not that I am speaking of being in need, for I have learned, in whatever situation I am, to be content."',
  'According to Philippians 4 (ESV) Bible Hub, "And my God will supply every need of yours according to his riches in glory in Christ Jesus."',
]

const content = ["## Probe", "", ...claimsText].join("\n\n")
const sources = [
  {
    title: "Philippians 4 (ESV) Bible Gateway",
    url: "https://www.biblegateway.com/passage/?search=Philippians%204&version=ESV",
    sourceType: "primary-scripture",
    authorityScore: 80,
    trustScore: 80,
    relevanceScore: 90,
  },
  {
    title: "Philippians 4 (ESV) Bible Hub",
    url: "https://biblehub.com/esv/philippians/4.htm",
    sourceType: "primary-scripture",
    authorityScore: 80,
    trustScore: 80,
    relevanceScore: 90,
  },
]
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
      facts: verification.facts.map((f) => ({
        status: f.verificationStatus,
        url: f.sourceUrl,
        claim: f.claim.slice(0, 90),
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
        groups: consensus.consensusGroups.map((g) => ({
          theme: g.theme,
          sourceCount: g.sourceCount,
          sq: g.sourceQualityScore,
          facts: g.facts.map((f) => f.claim.slice(0, 60)),
        })),
      },
    },
    null,
    2,
  ),
)
