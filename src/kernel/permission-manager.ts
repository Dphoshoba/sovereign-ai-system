import type { PermissionLevel } from "./types"

export type Role = PermissionLevel["role"]

export const DEFAULT_ROLES: Record<Role, PermissionLevel> = {
  founder: { role: "founder", canRead: true, canWrite: true, canDelete: true, canManage: true },
  ceo: { role: "ceo", canRead: true, canWrite: true, canDelete: true, canManage: true },
  executive: { role: "executive", canRead: true, canWrite: true, canDelete: false, canManage: true },
  editor: { role: "editor", canRead: true, canWrite: true, canDelete: false, canManage: false },
  researcher: { role: "researcher", canRead: true, canWrite: true, canDelete: false, canManage: false },
  viewer: { role: "viewer", canRead: true, canWrite: false, canDelete: false, canManage: false },
  client: { role: "client", canRead: true, canWrite: false, canDelete: false, canManage: false },
  public: { role: "public", canRead: true, canWrite: false, canDelete: false, canManage: false },
}

export class PermissionManager {
  private rolePermissions: Map<Role, PermissionLevel> = new Map()

  constructor() {
    // Initialize with default roles
    Object.entries(DEFAULT_ROLES).forEach(([role, permissions]) => {
      this.rolePermissions.set(role as Role, permissions)
    })
  }

  checkPermission(role: Role, action: "read" | "write" | "delete" | "manage"): boolean {
    const permissions = this.rolePermissions.get(role)
    if (!permissions) return false

    switch (action) {
      case "read":
        return permissions.canRead
      case "write":
        return permissions.canWrite
      case "delete":
        return permissions.canDelete
      case "manage":
        return permissions.canManage
      default:
        return false
    }
  }

  can(role: Role, action: "read" | "write" | "delete" | "manage"): boolean {
    return this.checkPermission(role, action)
  }

  getRolePermissions(role: Role): PermissionLevel | undefined {
    return this.rolePermissions.get(role)
  }

  getAllRoles(): Role[] {
    return Array.from(this.rolePermissions.keys())
  }

  setRolePermissions(role: Role, permissions: PermissionLevel): void {
    this.rolePermissions.set(role, permissions)
  }

  hasPermission(role: Role, permissions: string[]): boolean {
    const rolePerms = this.rolePermissions.get(role)
    if (!rolePerms) return false

    return permissions.every((perm) => {
      if (perm === "read") return rolePerms.canRead
      if (perm === "write") return rolePerms.canWrite
      if (perm === "delete") return rolePerms.canDelete
      if (perm === "manage") return rolePerms.canManage
      return false
    })
  }
}
