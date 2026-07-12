import { buildGammaStage5ReleaseOperatorApprovalReceipt } from "../../../../../src/lib/gamma-2/stage-5-release-operator-approval-receipt";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseOperatorApprovalReceipt(), { status: 200 });
}
