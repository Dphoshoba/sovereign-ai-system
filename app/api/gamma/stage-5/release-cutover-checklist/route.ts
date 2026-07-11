import { buildGammaStage5ReleaseCutoverChecklist } from "../../../../../src/lib/gamma-2/stage-5-release-cutover-checklist";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseCutoverChecklist(), { status: 200 });
}
