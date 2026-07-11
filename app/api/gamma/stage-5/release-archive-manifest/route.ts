import { buildGammaStage5ReleaseArchiveManifest } from "../../../../../src/lib/gamma-2/stage-5-release-archive-manifest";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseArchiveManifest(), { status: 200 });
}
