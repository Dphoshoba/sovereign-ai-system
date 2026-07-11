import { buildGammaStage5ReleasePromotionPlan } from "../../../../../src/lib/gamma-2/stage-5-release-promotion-plan";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleasePromotionPlan(), { status: 200 });
}
