import type { DriveResource } from "./resource-parser";
import { PermissionResolutionBase, type PermissionResolution, type GammaPermissionRole } from "../../platform/security/permission-resolution";

export class DrivePermissionAdapter extends PermissionResolutionBase {
  resolve(resource: any, identity: string): PermissionResolution {
    const res = resource as DriveResource;
    const allPermissions = res.permissions || [];
    const isOwner = res.owners.includes(identity);
    const explicit = allPermissions.filter(p => p.email === identity);
    const inherited = res.inheritedPermissions ? allPermissions.filter(p => p.type !== 'user') : [];

    let role: GammaPermissionRole = "unknown";
    if (isOwner) {
      role = "owner";
    } else if (explicit.length > 0) {
      role = this.mapNativeRole(explicit[0].role);
    } else if (inherited.length > 0) {
      role = this.mapNativeRole(inherited[0].role);
    } else {
      role = "reader";
    }

    return {
      effectiveRole: role,
      isInherited: explicit.length === 0 && inherited.length > 0,
      isOwner,
      capabilities: {
        canShare: role === "owner" || role === "editor",
        canDelete: role === "owner",
        canEdit: role === "owner" || role === "editor" || role === "contributor",
        canComment: role !== "restricted",
      },
    };
  }

  private mapNativeRole(nativeRole: string): GammaPermissionRole {
    const mapping: Record<string, GammaPermissionRole> = {
      owner: "owner",
      writer: "editor",
      commenter: "commenter",
      viewer: "reader",
    };
    return mapping[nativeRole] || "unknown";
  }
}
