import { buildGammaStage5OpenApiDocument } from "../../../../../src/lib/gamma-2/stage-5-openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5OpenApiDocument(), { status: 200 });
}
