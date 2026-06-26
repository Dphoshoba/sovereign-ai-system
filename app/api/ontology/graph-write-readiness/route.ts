import { NextResponse } from "next/server"

import { buildSemanticGraphPayload } from "../../../../lib/ontology/semantic-graph-adapter"
import {
  buildEntityResolutionPlan,
  type ExistingEntityCandidate,
} from "../../../../lib/ontology/entity-resolution"
import { buildGovernedExecutionPlan } from "../../../../lib/ontology/governed-ingestion"
import { buildIngestionReviewItems } from "../../../../lib/ontology/ingestion-review-queue"
import {
  evaluateGraphWriteReadiness,
  summarizeGraphReadiness,
} from "../../../../lib/ontology/graph-write-readiness"
import { buildReviewDecision, prepareGraphWriteDecision } from "../../../../lib/ontology/review-decision-pipeline"
import {
  executeSemanticGraphTransaction,
  summarizeTransactionResult,
} from "../../../../lib/ontology/semantic-graph-transaction-executor"
import type { OntologyExtractionResult } from "../../../../lib/ontology"
import type { IngestionReviewPackageResult } from "../../../../lib/ontology/ingestion-review-package"

const ontologyExample: OntologyExtractionResult = {
  category: "ai-tools",
  title: "Graph Readiness Integration Example",
  summary:
    "A research assistant supports a publishing workflow through a human review checkpoint.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "graph-write-readiness-example",
  sourceId: "phase-4e-slice-3-readiness",
  themes: ["Responsible Automation", "Creator Productivity"],
  confidence: 0.92,
  entities: [
    {
      type: "application",
      name: "AI research assistant",
      summary: "A tool that gathers and organizes source material.",
      aliases: ["AI research helper"],
      importance: 82,
      confidence: 0.92,
    },
    {
      type: "process",
      name: "Human review",
      summary: "A review checkpoint for claims, tone, and usefulness.",
      importance: 88,
      confidence: 0.9,
    },
    {
      type: "process",
      name: "Publishing workflow",
      summary: "The process that turns approved research into publishable content.",
      importance: 78,
      confidence: 0.88,
    },
  ],
  relationships: [
    {
      type: "supports",
      sourceEntityName: "AI research assistant",
      targetEntityName: "Publishing workflow",
      summary: "The tool prepares inputs for publishing.",
      strength: 0.86,
      confidence: 0.88,
    },
    {
      type: "depends-on",
      sourceEntityName: "Publishing workflow",
      targetEntityName: "Human review",
      summary: "Publishing depends on human review before release.",
      strength: 0.9,
      confidence: 0.9,
    },
  ],
}

const mockExistingCandidates: ExistingEntityCandidate[] = [
  {
    id: "mock-node-ai-research-helper",
    name: "AI research helper",
    nodeType: "application",
    summary: "A tool used to gather, compare, and organize research material.",
    metadata: {
      aliases: ["AI research assistant"],
    },
    status: "active",
  },
]

export async function GET() {
  const flow = await buildReadinessFlow()

  return NextResponse.json({
    ok: true,
    dryRun: true,
    readOnly: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    automaticApproval: false,
    automaticExecution: false,
    ...flow,
  })
}

async function buildReadinessFlow() {
  const actorId = "human-reviewer-preview"
  const organizationId = "preview-organization"
  const workspaceId = "preview-workspace"
  const payload = buildSemanticGraphPayload(ontologyExample, {
    organizationId,
    workspaceId,
  })
  const governedPlan = buildGovernedExecutionPlan({
    requestId: "phase-4e-slice-3-readiness",
    payload,
    requestedBy: actorId,
    source: "graph-write-readiness-route",
    reason: "Read-only graph write readiness example.",
    dryRun: true,
  })
  const entityResolutionPlan = buildEntityResolutionPlan(
    payload,
    mockExistingCandidates
  )
  const reviewItems = buildIngestionReviewItems({
    entityResolutionPlan,
    governedPlan,
    requestedBy: actorId,
  })
  const reviewItem = reviewItems[0]
  const mockPackage: Pick<
    IngestionReviewPackageResult,
    "ok" | "createdPackageIds" | "graphWrites"
  > = {
    ok: true,
    createdPackageIds: ["preview-execution-authorization-request"],
    graphWrites: false,
  }
  const reviewDecision = buildReviewDecision({
    packageId: mockPackage.createdPackageIds[0],
    reviewItem,
    decision: "APPROVE_MATCH",
    actorId,
    organizationId,
    workspaceId,
    notes: "Preview approval for readiness evaluation only.",
  })
  const preparedDecision = prepareGraphWriteDecision({
    decision: reviewDecision,
    governedPlan,
  })
  const transactionPreview = await executeSemanticGraphTransaction({
    plan: governedPlan,
    dryRun: true,
    actorId,
    organizationId,
    workspaceId,
  })
  const readiness = evaluateGraphWriteReadiness({
    governedPlan,
    entityResolutionPlan,
    reviewItems,
    reviewPackage: mockPackage,
    preparedDecision,
    transactionPreview,
    actorId,
    organizationId,
    workspaceId,
  })

  return {
    ontology: ontologyExample,
    semanticGraphPayload: payload,
    governedPlan,
    entityResolutionPlan,
    reviewItems,
    reviewPackage: mockPackage,
    reviewDecision,
    preparedDecision,
    transactionPreview: summarizeTransactionResult(transactionPreview),
    readiness,
    summary: summarizeGraphReadiness(readiness),
  }
}
