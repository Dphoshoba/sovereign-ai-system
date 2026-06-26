import { NextResponse } from "next/server"

import {
  buildExecutionAuthorizationPayload,
  createIngestionReviewPackage,
  INGESTION_REVIEW_PACKAGE_SOURCE,
  summarizeReviewPackageResult,
  validateReviewPackageRequest,
  type IngestionReviewPackageRequest,
} from "../../../../../lib/ontology/ingestion-review-package"
import type { IngestionReviewQueueItem } from "../../../../../lib/ontology/ingestion-review-queue"

const exampleReviewItem: IngestionReviewQueueItem = {
  id: "review:entity:application:ai-research-assistant:possible_duplicate",
  title: "Review AI research assistant against AI research helper",
  reason: "POSSIBLE_DUPLICATE",
  targetType: "KnowledgeGraphNode",
  targetId: "mock-node-ai-research-helper",
  requestedBy: "phase-4e-review-package-route",
  priority: "high",
  riskLevel: "high",
  status: "pending",
  recommendedDecision: "REQUEST_CHANGES",
  rationale:
    "A proposed entity may duplicate an existing entity and needs a reviewer to approve create or match behavior.",
  entityOutcome: "POSSIBLE_DUPLICATE",
  entity: {
    name: "AI research assistant",
    nodeType: "application",
    fingerprint: "application:ai research assistant",
  },
  existingCandidate: {
    id: "mock-node-ai-research-helper",
    name: "AI research helper",
    nodeType: "application",
    similarityScore: 0.84,
  },
  payload: {
    duplicateRiskScore: 72,
    confidence: 0.78,
    allowedReviewerDecisions: [
      "APPROVE_CREATE",
      "APPROVE_MATCH",
      "REQUEST_CHANGES",
      "REJECT",
    ],
  },
}

export async function GET() {
  const previewRequest: IngestionReviewPackageRequest = {
    explicitCreatePackage: false,
    actorId: "preview-only",
    organizationId: "preview-org",
    source: INGESTION_REVIEW_PACKAGE_SOURCE,
    items: [exampleReviewItem],
  }
  const previewPayload = buildExecutionAuthorizationPayload(exampleReviewItem, {
    actorId: "preview-only",
    organizationId: "preview-org",
    source: INGESTION_REVIEW_PACKAGE_SOURCE,
    reason: "GET preview only",
  })

  return NextResponse.json({
    ok: true,
    dryRun: true,
    previewOnly: true,
    writesToPrisma: false,
    graphWrites: false,
    graphDeletes: false,
    databaseAccess: false,
    requiredPostFields: {
      explicitCreatePackage: true,
      actorId: "required",
      organizationId: "required",
      source: INGESTION_REVIEW_PACKAGE_SOURCE,
      items: "one or more pending ingestion review queue items",
    },
    validationPreview: validateReviewPackageRequest(previewRequest),
    executionAuthorizationPayloadPreview: previewPayload,
  })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IngestionReviewPackageRequest
    const result = await createIngestionReviewPackage(body)
    const status = result.ok ? 201 : 400

    return NextResponse.json(
      {
        ok: result.ok,
        writesToPrisma: result.writesToPrisma,
        graphWrites: result.graphWrites,
        graphDeletes: result.graphDeletes,
        databaseAccess: result.databaseAccess,
        model: result.model,
        createdPackageIds: result.createdPackageIds,
        createdPackages: result.createdPackages,
        errors: result.errors,
        warnings: result.warnings,
        summary: summarizeReviewPackageResult(result),
      },
      { status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        writesToPrisma: false,
        graphWrites: false,
        graphDeletes: false,
        databaseAccess: false,
        error:
          error instanceof Error
            ? error.message
            : "Review package creation failed.",
      },
      { status: 500 }
    )
  }
}
