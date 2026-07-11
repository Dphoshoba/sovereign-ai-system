import { buildGammaStage5ReleaseComplianceMatrix } from "../../../../../src/lib/gamma-2/stage-5-release-compliance-matrix";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseComplianceMatrix(), { status: 200 });
}
