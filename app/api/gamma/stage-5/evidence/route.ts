import { buildGammaStage5EvidenceBundle } from "../../../../../src/lib/gamma-2/stage-5-evidence";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5EvidenceBundle(), { status: 200 });
}
