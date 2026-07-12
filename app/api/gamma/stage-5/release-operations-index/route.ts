import { buildGammaStage5ReleaseOperationsIndex } from "../../../../../src/lib/gamma-2/stage-5-release-operations-index";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseOperationsIndex(), { status: 200 });
}
