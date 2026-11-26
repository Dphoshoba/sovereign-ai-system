import { buildApprovalChains } from "./approval-chain"
import { buildApprovalEvidenceItems } from "./approval-evidence"
import { buildReviewWorkflowSteps } from "./review-workflow"

export type EnterpriseDecisionPacket = {
  id: string
  title: string
  status: "preview-only"
  evidenceIds: string[]
  chainIds: string[]
  workflowStepIds: string[]
  explainability: "complete"
  persistence: false
  execution: false
}

export function buildEnterpriseDecisionPackets(): EnterpriseDecisionPacket[] {
  return [
    {
      id: "graph-ingestion-decision-preview",
      title: "Graph Ingestion Decision Preview",
      status: "preview-only",
      evidenceIds: buildApprovalEvidenceItems().map((item) => item.id),
      chainIds: buildApprovalChains().map((chain) => chain.id),
      workflowStepIds: buildReviewWorkflowSteps().map((step) => step.id),
      explainability: "complete",
      persistence: false,
      execution: false,
    },
    {
      id: "publishing-decision-preview",
      title: "Publishing Decision Preview",
      status: "preview-only",
      evidenceIds: ["audit-coverage-evidence", "guard-evidence-readiness", "policy-segregation-evidence"],
      chainIds: ["publishing-approval-chain"],
      workflowStepIds: ["intake", "domain-review", "decision-packet-preview"],
      explainability: "complete",
      persistence: false,
      execution: false,
    },
  ]
}

export function evaluateDecisionExplainability(
  packets: EnterpriseDecisionPacket[] = buildEnterpriseDecisionPackets()
) {
  const allPreview = packets.every((packet) => packet.status === "preview-only")
  const allExplainable = packets.every((packet) => packet.explainability === "complete")
  const allHaveEvidence = packets.every((packet) => packet.evidenceIds.length > 0)
  const allNonPersistent = packets.every((packet) => packet.persistence === false)
  const allNonExecuting = packets.every((packet) => packet.execution === false)
  const checks = [allPreview, allExplainable, allHaveEvidence, allNonPersistent, allNonExecuting]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "DECISION_PACKETS_EXPLAINABLE_PREVIEW_ONLY" as const,
    packetCount: packets.length,
    persistence: false,
    execution: false,
  }
}

