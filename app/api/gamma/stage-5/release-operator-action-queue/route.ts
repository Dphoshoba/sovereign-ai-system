import { buildGammaStage5ReleaseOperatorActionQueue } from "../../../../../src/lib/gamma-2/stage-5-release-operator-action-queue";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseOperatorActionQueue(), { status: 200 });
}
