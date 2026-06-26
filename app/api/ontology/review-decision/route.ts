import { NextResponse } from "next/server"

import {
  buildReviewDecision,
  prepareGraphWriteDecision,
  summarizeDecision,
  validateReviewDecision,
  type ReviewDecisionAction,
} from "../../../../lib/ontology/review-decision-pipeline"
import type { IngestionReviewQueueItem } from "../../../../lib/ontology/ingestion-review-queue"

const exampleReviewItem: IngestionReviewQueueItem = {
  id: "review:phase-4e-slice-3:possible-duplicate",
  title: "Review AI research assistant against AI research helper",
  reason: "POSSIBLE_DUPLICATE",
  targetType: "KnowledgeGraphNode",
  targetId: "mock-node-ai-research-helper",
  requestedBy: "review-decision-route",
  priority: "high",
  riskLevel: "high",
  status: "pending",
  recommendedDecision: "REQUEST_CHANGES",
  rationale:
    "A proposed entity may duplicate an existing entity and needs a reviewer disposition before graph readiness.",
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
    allowedReviewerDecisions: [
      "APPROVE_CREATE",
      "APPROVE_MATCH",
      "REQUEST_MORE_INFORMATION",
      "REJECT",
    ],
  },
}

export async function GET() {
  const decision = buildReviewDecision({
    packageId: "preview-execution-authorization-request",
    reviewItem: exampleReviewItem,
    decision: "APPROVE_MATCH",
    actorId: "human-reviewer-preview",
    organizationId: "preview-organization",
    workspaceId: "preview-workspace",
    notes: "Preview only; no graph write is executed.",
  })
  const prepared = prepareGraphWriteDecision({ decision })

  return NextResponse.json({
    ok: true,
    dryRun: true,
    graphWrites: false,
    automaticApproval: false,
    automaticExecution: false,
    reviewItem: exampleReviewItem,
    decision,
    validation: validateReviewDecision(decision),
    prepared,
    summary: summarizeDecision(decision),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.dryRun === false) {
      return NextResponse.json(
        {
          ok: false,
          dryRun: true,
          graphWrites: false,
          error: "Review decision POST is dry-run only.",
        },
        { status: 400 }
      )
    }

    const decision = buildReviewDecision({
      packageId: body.packageId ?? null,
      reviewItem: body.reviewItem ?? exampleReviewItem,
      decision: (body.decision ?? "REQUEST_MORE_INFORMATION") as ReviewDecisionAction,
      actorId: body.actorId ?? null,
      organizationId: body.organizationId ?? null,
      workspaceId: body.workspaceId ?? null,
      notes: body.notes ?? null,
      evidence: body.evidence ?? {},
    })
    const validation = validateReviewDecision(decision)

    return NextResponse.json(
      {
        ok: validation.valid,
        dryRun: true,
        graphWrites: false,
        automaticApproval: false,
        automaticExecution: false,
        decision,
        validation,
        prepared: prepareGraphWriteDecision({ decision }),
        summary: summarizeDecision(decision),
      },
      { status: validation.valid ? 200 : 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        dryRun: true,
        graphWrites: false,
        error:
          error instanceof Error
            ? error.message
            : "Review decision preparation failed.",
      },
      { status: 500 }
    )
  }
}
