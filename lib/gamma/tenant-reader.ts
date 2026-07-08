import { TENANT_ASSETS } from "../tenant/mock-data"
import type { TenantWorkspace } from "../tenant/types"

export async function getTenantRegistry(): Promise<TenantWorkspace> {
  return TENANT_ASSETS
}
