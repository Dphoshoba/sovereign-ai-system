import { buildGammaStage5ReleaseClosureLedger } from "../../../../../src/lib/gamma-2/stage-5-release-closure-ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseClosureLedger(), { status: 200 });
}
