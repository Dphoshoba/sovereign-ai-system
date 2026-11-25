import { SDK_GENERATOR_ASSETS } from "../sdk-generator/mock-data"
import type { SDKGeneratorWorkspace } from "../sdk-generator/types"

export async function getSdkGeneratorRegistry(): Promise<SDKGeneratorWorkspace> {
  return SDK_GENERATOR_ASSETS
}
