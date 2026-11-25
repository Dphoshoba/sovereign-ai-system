import { buildGammaStage5OperatorBrief } from "../../../../../src/lib/gamma-2/stage-5-operator-brief";
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return Response.json(buildGammaStage5OperatorBrief(), { status: 200 });
}
