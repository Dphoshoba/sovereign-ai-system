import { buildGammaStage5DeploymentReceipt } from "../../../../../src/lib/gamma-2/stage-5-deployment-receipt";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5DeploymentReceipt(), { status: 200 });
}
