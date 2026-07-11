import { buildGammaStage5Health } from "../../../../../src/lib/gamma-2/stage-5-health";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5Health(), { status: 200 });
}
