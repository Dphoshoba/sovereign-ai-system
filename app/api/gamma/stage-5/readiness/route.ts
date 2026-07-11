import { buildGammaStage5ReadinessSnapshot } from "../../../../../src/lib/gamma-2/stage-5-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReadinessSnapshot(), { status: 200 });
}
