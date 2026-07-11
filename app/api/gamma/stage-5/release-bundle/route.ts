import { buildGammaStage5ReleaseBundle } from "../../../../../src/lib/gamma-2/stage-5-release-bundle";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseBundle(), { status: 200 });
}
