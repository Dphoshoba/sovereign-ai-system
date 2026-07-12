import { buildGammaStage5ReleaseProductionCutoverPacket } from "../../../../../src/lib/gamma-2/stage-5-release-production-cutover-packet";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseProductionCutoverPacket(), { status: 200 });
}
