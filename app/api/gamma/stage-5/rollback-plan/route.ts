import { buildGammaStage5RollbackPlan } from "../../../../../src/lib/gamma-2/stage-5-rollback-plan";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5RollbackPlan(), { status: 200 });
}
