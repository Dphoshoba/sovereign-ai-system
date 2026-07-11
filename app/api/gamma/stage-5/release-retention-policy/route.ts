import { buildGammaStage5ReleaseRetentionPolicy } from "../../../../../src/lib/gamma-2/stage-5-release-retention-policy";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseRetentionPolicy(), { status: 200 });
}
