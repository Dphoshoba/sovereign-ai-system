import { buildGammaStage5PromotionChecklist } from "../../../../../src/lib/gamma-2/stage-5-promotion-checklist";
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return Response.json(buildGammaStage5PromotionChecklist(), { status: 200 });
}
