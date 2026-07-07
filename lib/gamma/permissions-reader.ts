import { PERMISSIONS_ASSETS } from "../permissions/mock-data"
import type { PermissionsWorkspace } from "../permissions/types"

export async function getPermissionsRegistry(): Promise<PermissionsWorkspace> {
  return PERMISSIONS_ASSETS
}
