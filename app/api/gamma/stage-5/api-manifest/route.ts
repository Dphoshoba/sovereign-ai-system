import { buildGammaStage5ApiManifest } from "../../../../../src/lib/gamma-2/stage-5-api-manifest";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ApiManifest(), { status: 200 });
}
