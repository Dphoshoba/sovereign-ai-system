import { buildGammaStage5ReleaseDecisionRecord } from "../../../../../src/lib/gamma-2/stage-5-release-decision-record";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseDecisionRecord(), { status: 200 });
}
