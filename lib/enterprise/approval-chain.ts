export type ApprovalChainStep = {
  id: string
  name: string
  requiredEvidence: string[]
  reviewerRoleIds: string[]
  decisionMode: "recommendation-only"
  executionAllowed: false
}

export type ApprovalChain = {
  id: string
  name: string
  status: "preview-only"
  appliesTo: string[]
  steps: ApprovalChainStep[]
  persistence: false
}

export function buildApprovalChains(): ApprovalChain[] {
  return [
    {
      id: "graph-ingestion-approval-chain",
      name: "Graph Ingestion Approval Chain",
      status: "preview-only",
      appliesTo: ["ontology proposals", "entity resolution", "graph write readiness"],
      persistence: false,
      steps: [
        {
          id: "evidence-review",
          name: "Evidence Review",
          requiredEvidence: ["source lineage", "claim support", "guard evidence packet"],
          reviewerRoleIds: ["enterprise-reviewer", "research-lead"],
          decisionMode: "recommendation-only",
          executionAllowed: false,
        },
        {
          id: "governance-review",
          name: "Governance Review",
          requiredEvidence: ["tenant scope", "policy isolation", "cross-tenant risk score"],
          reviewerRoleIds: ["enterprise-administrator", "enterprise-reviewer"],
          decisionMode: "recommendation-only",
          executionAllowed: false,
        },
      ],
    },
    {
      id: "publishing-approval-chain",
      name: "Publishing Approval Chain",
      status: "preview-only",
      appliesTo: ["campaign preview", "draft preview", "publication readiness"],
      persistence: false,
      steps: [
        {
          id: "content-review",
          name: "Content Review",
          requiredEvidence: ["campaign lineage", "citation requirements", "risk flags"],
          reviewerRoleIds: ["enterprise-reviewer", "content-strategist"],
          decisionMode: "recommendation-only",
          executionAllowed: false,
        },
      ],
    },
  ]
}

export function evaluateApprovalCoverage(chains: ApprovalChain[] = buildApprovalChains()) {
  const allPreviewOnly = chains.every((chain) => chain.status === "preview-only")
  const allStepsNonExecuting = chains.every((chain) =>
    chain.steps.every((step) => step.executionAllowed === false)
  )
  const allHaveEvidence = chains.every((chain) =>
    chain.steps.every((step) => step.requiredEvidence.length > 0)
  )
  const allHaveReviewers = chains.every((chain) =>
    chain.steps.every((step) => step.reviewerRoleIds.length > 0)
  )
  const checks = [allPreviewOnly, allStepsNonExecuting, allHaveEvidence, allHaveReviewers]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "APPROVAL_CHAINS_PREVIEW_READY" as const,
    chainCount: chains.length,
    execution: false,
    persistence: false,
  }
}

