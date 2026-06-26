import { NextResponse } from "next/server"

import { buildSemanticGraphPayload } from "../../../../lib/ontology/semantic-graph-adapter"
import {
  buildEntityResolutionPlan,
  summarizeEntityResolutionPlan,
  type ExistingEntityCandidate,
} from "../../../../lib/ontology/entity-resolution"
import type { OntologyExtractionResult } from "../../../../lib/ontology"

const ontologyExample: OntologyExtractionResult = {
  category: "ai-tools",
  title: "Phase 4D Entity Resolution Example",
  summary:
    "An AI research assistant supports a publishing workflow that depends on human review.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "entity-resolution-example",
  sourceId: "phase-4d-entity-resolution-example",
  themes: ["Responsible Automation", "Creator Productivity"],
  confidence: 0.9,
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
    {
      type: "application",
      name: "Editorial approval queue",
      summary: "A system for holding content until a reviewer approves it.",
      importance: 72,
      confidence: 0.84,
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
    {
      type: "supports",
      sourceEntityName: "Editorial approval queue",
      targetEntityName: "Human review",
      summary: "The queue supports review before release.",
      strength: 0.78,
      confidence: 0.8,
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
    id: "mock-node-human-review",
    name: "Human review",
    nodeType: "process",
    summary: "A governance checkpoint where a person approves content quality.",
    status: "active",
  },
  {
    id: "mock-node-editorial-approval",
    name: "Editorial approval",
    nodeType: "process",
    summary: "A review process for approving content before publication.",
    status: "active",
  },
  {
    id: "mock-node-publishing-workflow-app",
    name: "Publishing workflow",
    nodeType: "application",
    summary: "A system that coordinates publishing tasks.",
    status: "active",
  },
]

export async function GET() {
  const payload = buildSemanticGraphPayload(ontologyExample)
  const plan = buildEntityResolutionPlan(payload, mockExistingCandidates)

  return NextResponse.json({
    ok: true,
    dryRun: true,
    writesToPrisma: false,
    deletesFromPrisma: false,
    databaseAccess: false,
    payload,
    mockExistingCandidates,
    plan,
    summary: summarizeEntityResolutionPlan(plan),
  })
}
