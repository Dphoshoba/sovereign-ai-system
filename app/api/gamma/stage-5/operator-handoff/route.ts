import { buildGammaStage5OperatorHandoff } from "../../../../../src/lib/gamma-2/stage-5-operator-handoff";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5OperatorHandoff(), { status: 200 });
}
