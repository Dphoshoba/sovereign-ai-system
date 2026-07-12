import { buildGammaStage5ReleaseOperatorApprovalPacket } from "../../../../../src/lib/gamma-2/stage-5-release-operator-approval-packet";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseOperatorApprovalPacket(), { status: 200 });
}
