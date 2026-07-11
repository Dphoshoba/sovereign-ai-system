import { buildGammaStage5AuditLedger } from "../../../../../src/lib/gamma-2/stage-5-audit-ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5AuditLedger(), { status: 200 });
}
