import { buildGammaStage5ReleaseMonitoringPlan } from "../../../../../src/lib/gamma-2/stage-5-release-monitoring-plan";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseMonitoringPlan(), { status: 200 });
}
