import { buildGammaStage5SdkDescriptor } from "../../../../../src/lib/gamma-2/stage-5-sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(buildGammaStage5SdkDescriptor(), { status: 200 });
}
