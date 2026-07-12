import { buildGammaStage5ReleaseCloseoutPacket } from "../../../../../src/lib/gamma-2/stage-5-release-closeout-packet";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseCloseoutPacket(), { status: 200 });
}
