import { GAMMA_CLOUD_ASSETS } from "../gamma-cloud/mock-data"
import type { GammaCloudWorkspace } from "../gamma-cloud/types"

export async function getGammaCloudRegistry(): Promise<GammaCloudWorkspace> {
  return GAMMA_CLOUD_ASSETS
}
