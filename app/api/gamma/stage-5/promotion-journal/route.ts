import { buildGammaStage5PromotionJournal } from "../../../../../src/lib/gamma-2/stage-5-promotion-journal";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5PromotionJournal(), { status: 200 });
}
