import { NextResponse } from "next/server"

import { buildSemanticGraphPayload } from "../../../../lib/ontology/semantic-graph-adapter"
import {
  buildGovernedExecutionPlan,
  type GovernedIngestionRequest,
} from "../../../../lib/ontology/governed-ingestion"
import {
  executeSemanticGraphTransaction,
  summarizeTransactionResult,
} from "../../../../lib/ontology/semantic-graph-transaction-executor"
import type { OntologyExtractionResult } from "../../../../lib/ontology"

const ontologyExample: OntologyExtractionResult = {
  category: "ai-tools",
  title: "Semantic Graph Transaction Interface Example",
  summary:
    "A governed AI workflow candidate for transaction preview without database writes.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "transaction-interface-example",
  sourceId: "transaction-interface-example:ai-tools",
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

export async function GET() {
  const governedPlan = buildGovernedExecutionPlan(buildGovernedRequest())

  const dryRunPreview = executeSemanticGraphTransaction({
    plan: governedPlan,
  })
  const blockedWrite = executeSemanticGraphTransaction({
    plan: governedPlan,
    dryRun: false,
    explicitWriteEnabled: false,
  })
  const allowedButNotExecuted = executeSemanticGraphTransaction({
    plan: governedPlan,
    dryRun: false,
    explicitWriteEnabled: true,
    actorId: "phase-4c-slice-1-example-actor",
    organizationId: "example-organization",
    workspaceId: "example-workspace",
  })

  return NextResponse.json({
    ok: true,
    writesToPrisma: false,
    databaseAccess: false,
    dryRunPreview,
    blockedWrite,
    allowedButNotExecuted,
    summaries: {
      dryRunPreview: summarizeTransactionResult(dryRunPreview),
      blockedWrite: summarizeTransactionResult(blockedWrite),
      allowedButNotExecuted: summarizeTransactionResult(allowedButNotExecuted),
    },
  })
}

function buildGovernedRequest(): GovernedIngestionRequest {
  return {
    requestId: "phase-4c-transaction-interface-example",
    payload: buildSemanticGraphPayload(ontologyExample),
    requestedBy: "semantic-graph-transaction-route",
    source: "phase-4c-slice-1",
    reason: "Read-only transaction executor interface example.",
    dryRun: true,
  }
}
