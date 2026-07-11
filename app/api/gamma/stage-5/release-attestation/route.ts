import { buildGammaStage5ReleaseAttestation } from "../../../../../src/lib/gamma-2/stage-5-release-attestation";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseAttestation(), { status: 200 });
}
