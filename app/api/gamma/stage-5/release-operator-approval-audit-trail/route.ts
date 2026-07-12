import { buildGammaStage5ReleaseOperatorApprovalAuditTrail } from "../../../../../src/lib/gamma-2/stage-5-release-operator-approval-audit-trail";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseOperatorApprovalAuditTrail(), { status: 200 });
}
