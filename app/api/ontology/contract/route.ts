import { NextResponse } from "next/server"

import {
  DOMAIN_CATEGORIES,
  mapOntologyToSemanticGraphShape,
  ontologyTypesForDomain,
  type OntologyExtractionResult,
} from "../../../../lib/ontology"

const bibleStoriesExample: OntologyExtractionResult = {
  category: "bible-stories",
  title: "David and Goliath Ontology Contract Example",
  summary:
    "A biblical conflict story where faithful courage, leadership, and wise action confront intimidation.",
  topic: "David and Goliath",
  sourceLayer: "ontology",
  sourceType: "contract-example",
  sourceId: "ontology-example:bible-stories:david-goliath",
  themes: ["Faith and Courage", "Leadership"],
  confidence: 0.86,
  entities: [
    {
      type: "person",
      name: "David",
      summary: "The young shepherd who confronts Goliath through faithful action.",
      importance: 90,
      confidence: 0.9,
    },
    {
      type: "person",
      name: "Goliath",
      summary: "The Philistine champion whose intimidation creates the central conflict.",
      importance: 85,
      confidence: 0.9,
    },
    {
      type: "person",
      name: "Saul",
      summary: "The king who questions David's ability before the battle.",
      importance: 75,
      confidence: 0.84,
    },
    {
      type: "theme",
      name: "Faith and Courage",
      summary: "Fear is confronted through faithful, concrete action.",
      importance: 88,
      confidence: 0.86,
    },
    {
      type: "theme",
      name: "Leadership",
      summary: "Leadership can emerge through courage, trust, and decisive action.",
      importance: 82,
      confidence: 0.82,
    },
  ],
  relationships: [
    {
      type: "confronts",
      sourceEntityName: "David",
      targetEntityName: "Goliath",
      summary: "David confronts the threat represented by Goliath.",
      strength: 0.92,
      confidence: 0.9,
    },
    {
      type: "challenges",
      sourceEntityName: "Saul",
      targetEntityName: "David",
      summary: "Saul questions David's readiness to fight Goliath.",
      strength: 0.76,
      confidence: 0.82,
    },
    {
      type: "demonstrates",
      sourceEntityName: "David",
      targetEntityName: "Faith and Courage",
      summary: "David's action demonstrates courage rooted in faith.",
      strength: 0.88,
      confidence: 0.86,
    },
    {
      type: "demonstrates",
      sourceEntityName: "David",
      targetEntityName: "Leadership",
      summary: "David's decision reframes leadership around courage and trust.",
      strength: 0.82,
      confidence: 0.8,
    },
  ],
}

const aiToolsExample: OntologyExtractionResult = {
  category: "ai-tools",
  title: "AI Creator Workflow Ontology Contract Example",
  summary:
    "An AI tool workflow where applications support research, drafting, review, and publishing without replacing human judgment.",
  topic: "AI tools for creators",
  sourceLayer: "ontology",
  sourceType: "contract-example",
  sourceId: "ontology-example:ai-tools:creator-workflow",
  themes: ["Responsible Automation", "Creator Productivity"],
  confidence: 0.84,
  entities: [
    {
      type: "application",
      name: "AI research assistant",
      summary: "A tool that helps collect and organize source material.",
      importance: 82,
      confidence: 0.84,
    },
    {
      type: "process",
      name: "Human review",
      summary: "A governance step where claims, tone, and usefulness are checked.",
      importance: 88,
      confidence: 0.88,
    },
    {
      type: "process",
      name: "Publishing workflow",
      summary: "The sequence that turns researched material into approved content.",
      importance: 78,
      confidence: 0.82,
    },
    {
      type: "theme",
      name: "Responsible Automation",
      summary: "Automation should increase capacity while preserving judgment.",
      importance: 86,
      confidence: 0.84,
    },
  ],
  relationships: [
    {
      type: "supports",
      sourceEntityName: "AI research assistant",
      targetEntityName: "Publishing workflow",
      summary: "The tool supports the workflow by preparing research inputs.",
      strength: 0.82,
      confidence: 0.84,
    },
    {
      type: "depends-on",
      sourceEntityName: "Publishing workflow",
      targetEntityName: "Human review",
      summary: "Governed publishing depends on human review before release.",
      strength: 0.9,
      confidence: 0.88,
    },
    {
      type: "demonstrates",
      sourceEntityName: "Human review",
      targetEntityName: "Responsible Automation",
      summary: "Review keeps automation aligned with quality and trust.",
      strength: 0.86,
      confidence: 0.84,
    },
  ],
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: {
      categories: DOMAIN_CATEGORIES,
      domains: DOMAIN_CATEGORIES.map((category) => ontologyTypesForDomain(category)),
      semanticGraphTarget: [
        "SemanticKnowledgeRecord",
        "KnowledgeGraphNode",
        "KnowledgeGraphEdge",
      ],
      writesToPrisma: false,
    },
    examples: {
      "bible-stories": {
        ontology: bibleStoriesExample,
        semanticGraphShape: mapOntologyToSemanticGraphShape(bibleStoriesExample),
      },
      "ai-tools": {
        ontology: aiToolsExample,
        semanticGraphShape: mapOntologyToSemanticGraphShape(aiToolsExample),
      },
    },
  })
}
