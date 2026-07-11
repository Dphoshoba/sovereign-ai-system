import { buildGammaStage5PromotionChecklist } from "../../../../../src/lib/gamma-2/stage-5-promotion-checklist";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5PromotionChecklist(), { status: 200 });
}
