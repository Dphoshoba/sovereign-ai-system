import { buildGammaStage5EvidenceIndex } from "../../../../../src/lib/gamma-2/stage-5-evidence-index";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5EvidenceIndex(), { status: 200 });
}
