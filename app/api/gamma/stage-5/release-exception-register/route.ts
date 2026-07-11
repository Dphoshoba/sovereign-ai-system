import { buildGammaStage5ReleaseExceptionRegister } from "../../../../../src/lib/gamma-2/stage-5-release-exception-register";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5ReleaseExceptionRegister(), { status: 200 });
}
