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

  const dryRunPreview = await executeSemanticGraphTransaction({
    plan: governedPlan,
  })
  const blockedWrite = await executeSemanticGraphTransaction({
    plan: governedPlan,
    dryRun: false,
    explicitWriteEnabled: false,
  })
  const explicitGatePreview = await executeSemanticGraphTransaction({
    plan: governedPlan,
    dryRun: true,
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
    explicitGatePreview,
    summaries: {
      dryRunPreview: summarizeTransactionResult(dryRunPreview),
      blockedWrite: summarizeTransactionResult(blockedWrite),
      explicitGatePreview: summarizeTransactionResult(explicitGatePreview),
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.writeMode !== "explicit-test-write") {
      return NextResponse.json(
        {
          ok: false,
          writesToPrisma: false,
          databaseAccess: false,
          error: 'writeMode must be "explicit-test-write".',
        },
        { status: 400 }
      )
    }

    if (body.explicitWriteEnabled !== true || body.dryRun !== false) {
      return NextResponse.json(
        {
          ok: false,
          writesToPrisma: false,
          databaseAccess: false,
          error:
            "explicitWriteEnabled must be true and dryRun must be false for test writes.",
        },
        { status: 400 }
      )
    }

    if (!body.actorId || !body.organizationId || !body.workspaceId) {
      return NextResponse.json(
        {
          ok: false,
          writesToPrisma: false,
          databaseAccess: false,
          error: "actorId, organizationId, and workspaceId are required.",
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const ontology: OntologyExtractionResult = {
      ...ontologyExample,
      title: body.title || `Semantic Graph Controlled Write Test ${now}`,
      sourceType: "transaction-controlled-test",
      sourceId:
        body.sourceId ||
        `phase-4c-controlled-write:${now.replace(/[^0-9a-z]/gi, "-")}`,
    }

    const governedPlan = buildGovernedExecutionPlan({
      requestId:
        body.requestId ||
        `phase-4c-controlled-write:${ontology.sourceId}`,
      payload: buildSemanticGraphPayload(ontology, {
        organizationId: body.organizationId,
        workspaceId: body.workspaceId,
      }),
      requestedBy: body.actorId,
      source: "phase-4c-guarded-write-executor",
      reason: body.reason || "Explicit controlled semantic graph write test.",
      dryRun: true,
    })

    const result = await executeSemanticGraphTransaction({
      plan: governedPlan,
      dryRun: false,
      explicitWriteEnabled: true,
      actorId: body.actorId,
      organizationId: body.organizationId,
      workspaceId: body.workspaceId,
      reason: body.reason || "Explicit controlled semantic graph write test.",
    })

    return NextResponse.json(
      {
        ok: result.ok,
        writesToPrisma: result.writesToPrisma,
        databaseAccess: result.databaseAccess,
        result,
        summary: summarizeTransactionResult(result),
      },
      { status: result.ok ? 200 : 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        writesToPrisma: false,
        databaseAccess: false,
        error:
          error instanceof Error
            ? error.message
            : "Semantic graph transaction test write failed.",
      },
      { status: 500 }
    )
  }
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
