import { buildGammaStage5ReleaseGovernanceMap } from "../../../../../src/lib/gamma-2/stage-5-release-governance-map";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseGovernanceMap(), { status: 200 });
}
