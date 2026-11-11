import { buildGammaStage5PromotionJournal } from "../../../../../src/lib/gamma-2/stage-5-promotion-journal";
import { requireEditorAuth } from "../../../../../lib/publishing/require-editor-auth"

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireEditorAuth()
  if (!auth.ok) return auth.response

  return Response.json(buildGammaStage5PromotionJournal(), { status: 200 });
}
