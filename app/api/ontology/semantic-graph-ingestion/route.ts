import { NextResponse } from "next/server"

import { buildSemanticGraphPayload } from "../../../../lib/ontology/semantic-graph-adapter"
import {
  createSemanticGraphIngestionPlan,
  summarizeIngestionPlan,
  validateIngestionPlan,
} from "../../../../lib/ontology/semantic-graph-ingestion"
import type { OntologyExtractionResult } from "../../../../lib/ontology"

const example: OntologyExtractionResult = {
  category: "ai-tools",
  title: "AI Creator Workflow Dry-Run Ingestion Example",
  summary:
    "A creator workflow where AI research support feeds governed publishing through human review.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "dry-run-example",
  sourceId: "ontology-ingestion-example:ai-tools:creator-workflow",
  themes: ["Responsible Automation", "Creator Productivity"],
  confidence: 0.84,
  entities: [
    {
      type: "application",
      name: "AI research assistant",
      summary: "A tool that gathers and organizes research inputs.",
      importance: 82,
      confidence: 0.84,
    },
    {
      type: "process",
      name: "Human review",
      summary: "A governance checkpoint for claims, usefulness, and tone.",
      importance: 88,
      confidence: 0.88,
    },
    {
      type: "process",
      name: "Publishing workflow",
      summary: "The process that turns approved research into publishable content.",
      importance: 78,
      confidence: 0.82,
    },
  ],
  relationships: [
    {
      type: "supports",
      sourceEntityName: "AI research assistant",
      targetEntityName: "Publishing workflow",
      summary: "Research support prepares inputs for the publishing workflow.",
      strength: 0.82,
      confidence: 0.84,
    },
    {
      type: "depends-on",
      sourceEntityName: "Publishing workflow",
      targetEntityName: "Human review",
      summary: "Governed publishing depends on review before release.",
      strength: 0.9,
      confidence: 0.88,
    },
  ],
}

export async function GET() {
  const payload = buildSemanticGraphPayload(example)
  const plan = createSemanticGraphIngestionPlan(payload)

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    payload,
    plan,
    validation: validateIngestionPlan(plan),
    summary: summarizeIngestionPlan(plan),
  })
}
