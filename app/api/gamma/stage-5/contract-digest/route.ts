import { buildGammaStage5ContractDigest } from "../../../../../src/lib/gamma-2/stage-5-contract-digest";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ContractDigest(), { status: 200 });
}
