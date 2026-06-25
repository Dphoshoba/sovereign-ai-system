import { NextResponse } from "next/server"

import {
  buildSemanticGraphPayload,
  validateSemanticGraphPayload,
  type SemanticGraphPayload,
} from "../../../../lib/ontology/semantic-graph-adapter"
import type { OntologyExtractionResult } from "../../../../lib/ontology"

const example: OntologyExtractionResult = {
  category: "bible-stories",
  title: "David and Goliath Semantic Graph Adapter Example",
  summary:
    "David confronts Goliath through faithful action while Saul's doubts reveal a leadership test.",
  topic: "David and Goliath",
  sourceLayer: "ontology",
  sourceType: "adapter-example",
  sourceId: "ontology-adapter-example:bible-stories:david-goliath",
  themes: ["Faith and Courage", "Leadership"],
  confidence: 0.86,
  entities: [
    {
      type: "person",
      name: "David",
      summary: "The young shepherd who confronts Goliath.",
      importance: 90,
      confidence: 0.9,
    },
    {
      type: "person",
      name: "Goliath",
      summary: "The Philistine champion who threatens Israel.",
      importance: 85,
      confidence: 0.9,
    },
    {
      type: "theme",
      name: "Faith and Courage",
      summary: "Fear can be confronted through faithful action.",
      importance: 88,
      confidence: 0.86,
    },
  ],
  relationships: [
    {
      type: "confronts",
      sourceEntityName: "David",
      targetEntityName: "Goliath",
      summary: "David confronts Goliath directly.",
      strength: 0.92,
      confidence: 0.9,
    },
    {
      type: "demonstrates",
      sourceEntityName: "David",
      targetEntityName: "Faith and Courage",
      summary: "David's action demonstrates faith and courage.",
      strength: 0.88,
      confidence: 0.86,
    },
  ],
}

export async function GET() {
  const payload: SemanticGraphPayload = buildSemanticGraphPayload(example)

  return NextResponse.json({
    ok: true,
    writesToPrisma: false,
    payload,
    validation: validateSemanticGraphPayload(payload),
  })
}
