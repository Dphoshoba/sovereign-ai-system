import { ORGANIZATION_ASSETS } from "../organization/mock-data"
import type { OrganizationWorkspace } from "../organization/types"

export async function getOrganizationRegistry(): Promise<OrganizationWorkspace> {
  return ORGANIZATION_ASSETS
}
