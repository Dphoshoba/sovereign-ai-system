import { buildGammaStage5DeploymentSummary } from "../../../../../src/lib/gamma-2/stage-5-deployment-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5DeploymentSummary(), { status: 200 });
}
