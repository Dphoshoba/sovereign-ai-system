import { buildGammaStage5ReleaseOperatorRegistry } from "../../../../../src/lib/gamma-2/stage-5-release-operator-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseOperatorRegistry(), { status: 200 });
}
