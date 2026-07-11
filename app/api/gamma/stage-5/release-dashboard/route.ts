import { buildGammaStage5ReleaseDashboard } from "../../../../../src/lib/gamma-2/stage-5-release-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseDashboard(), { status: 200 });
}
