import { buildGammaStage5ReleaseProductionCutoverPacket } from "../../../../../src/lib/gamma-2/stage-5-release-production-cutover-packet";
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return Response.json(buildGammaStage5ReleaseProductionCutoverPacket(), { status: 200 });
}
