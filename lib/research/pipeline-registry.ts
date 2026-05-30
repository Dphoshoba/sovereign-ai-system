export const phase1Rules = [
  "Never fabricate information.",
  "Only write using verifiable information.",
  "No invented statistics.",
  "No invented studies.",
  "No invented quotes.",
  "No invented companies.",
  "No unsupported factual claims.",
] as const

export const researchPipelineArchitecture = {
  name: "Source-Grounded Research Pipeline",
  status: "active",
  purpose:
    "Produce article drafts using only verifiable information collected through a structured research chain.",

  flow: [
    {
      step: 1,
      stage: "Research",
      module: "researchAgent",
      purpose: "Discover topic direction and research priorities.",
    },
    {
      step: 2,
      stage: "Source Collector",
      module: "sourceCollector",
      purpose: "Collect manual and search-backed source records.",
    },
    {
      step: 3,
      stage: "Evidence Registry",
      module: "evidenceRegistry",
      purpose: "Register extracted evidence between sources and claims.",
    },
    {
      step: 4,
      stage: "Fact Extractor",
      module: "factExtractor",
      purpose: "Derive structured claims from registered evidence.",
    },
    {
      step: 5,
      stage: "Outline Builder",
      module: "outlineBuilder",
      purpose: "Build article outline grounded in extracted facts.",
    },
    {
      step: 6,
      stage: "Article Generator",
      module: "articleGeneratorAgent",
      purpose: "Generate draft sections only from outline and verified facts.",
    },
    {
      step: 7,
      stage: "Fact Verification",
      module: "factVerifier",
      purpose: "Verify claims against sources before SEO and publication.",
    },
    {
      step: 8,
      stage: "SEO",
      module: "seoAgent",
      purpose: "Optimize metadata after fact verification.",
    },
    {
      step: 9,
      stage: "MDX Writer",
      module: "mdxWriter",
      purpose: "Write source-grounded MDX draft with evidence trail.",
    },
    {
      step: 10,
      stage: "Publisher",
      module: "publisherAgent",
      purpose: "Prepare draft for human review before publication.",
    },
  ],

  chain: "Claim → Evidence → Source",
  phase1Rules,
  publicationConstraint:
    "Publication is blocked until facts are source-linked and human review is complete.",
}
