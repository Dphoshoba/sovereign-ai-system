import { buildGammaStage5ReleaseApprovalPacket } from "../../../../../src/lib/gamma-2/stage-5-release-approval-packet";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseApprovalPacket(), { status: 200 });
}
