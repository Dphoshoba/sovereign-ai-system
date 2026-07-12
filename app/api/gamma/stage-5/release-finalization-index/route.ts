import { buildGammaStage5ReleaseFinalizationIndex } from "../../../../../src/lib/gamma-2/stage-5-release-finalization-index";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseFinalizationIndex(), { status: 200 });
}
