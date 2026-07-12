import { buildGammaStage5ReleaseCompletionCertificate } from "../../../../../src/lib/gamma-2/stage-5-release-completion-certificate";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseCompletionCertificate(), { status: 200 });
}
