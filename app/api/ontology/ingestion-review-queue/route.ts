import { NextResponse } from "next/server"

import { buildSemanticGraphPayload } from "../../../../lib/ontology/semantic-graph-adapter"
import {
  buildEntityResolutionPlan,
  type ExistingEntityCandidate,
} from "../../../../lib/ontology/entity-resolution"
import {
  buildIngestionReviewItems,
  mapReviewItemsToExistingApprovalShape,
  summarizeReviewQueue,
} from "../../../../lib/ontology/ingestion-review-queue"
import type { OntologyExtractionResult } from "../../../../lib/ontology"

const ontologyExample: OntologyExtractionResult = {
  category: "ai-tools",
  title: "Phase 4E Ingestion Review Queue Example",
  summary:
    "An AI research assistant supports a publishing workflow that depends on human review.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "ingestion-review-queue-example",
  sourceId: "phase-4e-review-queue-example",
  themes: ["Responsible Automation", "Creator Productivity"],
  confidence: 0.86,
  entities: [
    {
      type: "application",
      name: "AI research assistant",
      summary: "A tool that gathers and organizes source material.",
      aliases: ["AI research helper"],
      importance: 82,
      confidence: 0.88,
    },
    {
      type: "process",
      name: "Publishing workflow",
      summary: "The process that turns approved research into publishable content.",
      importance: 78,
      confidence: 0.82,
    },
    {
      type: "process",
      name: "Human review",
      summary: "A review checkpoint for claims, tone, and usefulness.",
      importance: 88,
      confidence: 0.9,
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
  {
    id: "mock-node-publishing-workflow",
    name: "Publishing workflow",
    nodeType: "application",
    summary: "A system that coordinates publishing tasks.",
    status: "active",
  },
  {
    id: "mock-node-human-review",
    name: "Human review",
    nodeType: "process",
    summary: "A governance checkpoint where a person approves content quality.",
    status: "active",
  },
]

export async function GET() {
  const payload = buildSemanticGraphPayload(ontologyExample)
  const entityResolutionPlan = buildEntityResolutionPlan(
    payload,
    mockExistingCandidates
  )
  const reviewItems = buildIngestionReviewItems({
    entityResolutionPlan,
    requestedBy: "phase-4e-review-queue-route",
  })

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    deletesFromPrisma: false,
    databaseAccess: false,
    recommendedApprovalModel: "ExecutionAuthorizationRequest",
    rationale:
      "ExecutionAuthorizationRequest is the best existing fit because it supports target/action/risk/status plus payload, result, and error fields.",
    entityResolutionSummary: {
      duplicateRiskScore: entityResolutionPlan.duplicateRiskScore,
      confidence: entityResolutionPlan.confidence,
      possibleDuplicates: entityResolutionPlan.possibleDuplicates.length,
      blockedConflicts: entityResolutionPlan.blockedConflicts.length,
    },
    reviewItems,
    summary: summarizeReviewQueue(reviewItems),
    existingApprovalShapePreview:
      mapReviewItemsToExistingApprovalShape(reviewItems),
  })
}
