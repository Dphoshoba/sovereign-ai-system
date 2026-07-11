import { buildGammaStage5OperatorSignoff } from "../../../../../src/lib/gamma-2/stage-5-operator-signoff";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5OperatorSignoff(), { status: 200 });
}
