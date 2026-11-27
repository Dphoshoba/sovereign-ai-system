import type { PermissionsWorkspace } from "./types"

export const PERMISSIONS_ASSETS: PermissionsWorkspace = {
  permissions: [
    {
      id: "role-001",
      name: "Admin",
      resources: ["*"],
      actions: ["read", "write", "delete", "admin"],
    },
    {
      id: "role-002",
      name: "User",
      resources: ["profile", "data"],
      actions: ["read", "write"],
    },
  ],
  metrics: {
    totalRoles: 2,
    totalUsers: 150,
    activeRoles: 2,
    permissionChecks: 5000,
  },
}
