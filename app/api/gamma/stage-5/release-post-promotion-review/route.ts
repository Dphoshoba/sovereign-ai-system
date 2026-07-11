import { buildGammaStage5ReleasePostPromotionReview } from "../../../../../src/lib/gamma-2/stage-5-release-post-promotion-review";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleasePostPromotionReview(), { status: 200 });
}
