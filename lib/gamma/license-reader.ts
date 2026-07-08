import { LICENSE_ASSETS } from "../licensing/mock-data"
import type { LicenseWorkspace } from "../licensing/types"

export async function getLicenseRegistry(): Promise<LicenseWorkspace> {
  return LICENSE_ASSETS
}
