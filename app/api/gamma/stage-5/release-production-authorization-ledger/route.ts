import { buildGammaStage5ReleaseProductionAuthorizationLedger } from "../../../../../src/lib/gamma-2/stage-5-release-production-authorization-ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseProductionAuthorizationLedger(), { status: 200 });
}
