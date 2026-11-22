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
  "According to NIST, AI risk management should be integrated into broader enterprise risk processes.",
  "According to NIST, the AI Risk Management Framework is intended for voluntary use and to improve the ability to incorporate trustworthiness considerations into the design, development, use, and evaluation of AI products, services, and systems.",
  "According to OpenAI usage policies, responsible use is a shared priority, and those policies are no substitute for legal requirements, professional duties, or ethical obligations that should influence how people use AI.",
  "According to OpenAI usage policies, people may not use its services for attempts to infringe on intellectual property rights of others.",
  "According to the IFCN Code of Principles, signatories want their readers to be able to verify findings themselves and provide all sources in enough detail that readers can replicate their work.",
]

const content = ["## Probe", "", ...claimsText].join("\n\n")
const sources = [
  {
    title: "NIST AI RMF 1.0 PDF",
    url: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
    sourceType: "primary-standard",
    authorityScore: 100,
    trustScore: 95,
    relevanceScore: 95,
  },
  {
    title: "OpenAI Usage policies",
    url: "https://openai.com/policies/usage-policies",
    sourceType: "vendor-policy",
    authorityScore: 85,
    trustScore: 85,
    relevanceScore: 90,
  },
  {
    title: "IFCN Code of Principles commitments",
    url: "https://ifcncodeofprinciples.poynter.org/know-more/the-commitments-of-the-code-of-principles",
    sourceType: "secondary-standard",
    authorityScore: 85,
    trustScore: 85,
    relevanceScore: 90,
  },
]
const listed = sources.map((s) => ({ url: s.url, title: s.title }))
const extracted = extractArticleClaims({
  title: "Fact-check probe",
  excerpt: claimsText[0],
  content,
  factualClaimLimit: FACTUAL_CLAIM_CEILING,
})
const evidence = await collectBoundedBatchEvidence("Fact-check probe", sources, {
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
      extracted: extracted.claims.length,
      acquisition: evidence.sourceDiagnostics?.map((d) => ({
        id: d.sourceId,
        category: d.category,
        accepted: d.acceptedPassageCount,
        chars: d.extractedCharacterCount,
      })),
      facts: verification.facts.map((f) => ({
        status: f.verificationStatus,
        count: f.verificationCount,
        url: f.sourceUrl,
        claim: f.claim.slice(0, 100),
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
        })),
      },
    },
    null,
    2,
  ),
)
