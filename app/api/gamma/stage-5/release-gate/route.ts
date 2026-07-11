import { buildGammaStage5ReleaseGate } from "../../../../../src/lib/gamma-2/stage-5-release-gate";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseGate(), { status: 200 });
}
