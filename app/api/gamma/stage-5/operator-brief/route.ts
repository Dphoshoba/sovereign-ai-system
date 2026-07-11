import { buildGammaStage5OperatorBrief } from "../../../../../src/lib/gamma-2/stage-5-operator-brief";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5OperatorBrief(), { status: 200 });
}
