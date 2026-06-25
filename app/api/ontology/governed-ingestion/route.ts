import { NextResponse } from "next/server"

import { buildSemanticGraphPayload } from "../../../../lib/ontology/semantic-graph-adapter"
import {
  buildGovernedExecutionPlan,
  summarizeGovernedPlan,
  type GovernedIngestionRequest,
} from "../../../../lib/ontology/governed-ingestion"
import type { OntologyExtractionResult } from "../../../../lib/ontology"

const allowExample: OntologyExtractionResult = {
  category: "ai-tools",
  title: "Governed AI Workflow Allow Example",
  summary:
    "A well-scoped AI workflow where research support feeds publishing through human review.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "governed-ingestion-example",
  sourceId: "governed-example:allow",
  themes: ["Responsible Automation", "Creator Productivity"],
  confidence: 0.92,
  entities: [
    {
      type: "application",
      name: "AI research assistant",
      summary: "A tool that gathers and organizes source material.",
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

const reviewExample: OntologyExtractionResult = {
  ...allowExample,
  title: "Governed AI Workflow Review Example",
  sourceId: "governed-example:review",
  confidence: 0.62,
  entities: [
    ...allowExample.entities,
    {
      type: "application",
      name: "AI research assistant",
      summary: "A duplicate entity candidate that should be reviewed.",
      importance: 70,
      confidence: 0.7,
    },
  ],
}

const blockExample: OntologyExtractionResult = {
  category: "history",
  title: "Governed Low Confidence Block Example",
  summary:
    "A low-confidence extraction with weak relationship evidence that should not enter the graph.",
  topic: "Unverified historical claim",
  sourceLayer: "ontology",
  sourceType: "governed-ingestion-example",
  sourceId: "governed-example:block",
  confidence: 0.24,
  entities: [
    {
      type: "person",
      name: "Unverified figure",
      summary: "A poorly supported entity.",
      importance: 60,
      confidence: 0.25,
    },
    {
      type: "event",
      name: "Unverified event",
      summary: "A poorly supported event.",
      importance: 60,
      confidence: 0.22,
    },
  ],
  relationships: [
    {
      type: "associated-with",
      sourceEntityName: "Unverified figure",
      targetEntityName: "Unverified event",
      summary: "The connection is not well supported.",
      strength: 0.2,
      confidence: 0.2,
    },
  ],
}

export async function GET() {
  const examples = {
    allow: buildExampleRequest("allow-example", allowExample),
    requiresReview: buildExampleRequest("review-example", reviewExample),
    block: buildExampleRequest("block-example", blockExample),
  }

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    databaseAccess: false,
    examples,
  })
}

function buildExampleRequest(
  requestId: string,
  ontology: OntologyExtractionResult
) {
  const request: GovernedIngestionRequest = {
    requestId,
    payload: buildSemanticGraphPayload(ontology),
    requestedBy: "phase-4b-governed-ingestion-route",
    source: ontology.sourceType ?? "example",
    reason: "Read-only governed ingestion example.",
    dryRun: true,
  }
  const plan = buildGovernedExecutionPlan(request)

  return {
    ontology,
    request,
    governedPlan: plan,
    audit: plan.audit,
    summary: summarizeGovernedPlan(plan),
  }
}
