import { buildGammaStage5ReleaseTrafficShiftPlan } from "../../../../../src/lib/gamma-2/stage-5-release-traffic-shift-plan";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseTrafficShiftPlan(), { status: 200 });
}
