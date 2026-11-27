import type { DriveResource, DrivePermission } from "./resource-parser";
import type { ResourceSecurityClassification } from "../../platform/security/resource-security-types";

export interface PermissionAnalysis {
  effectiveRole: string;
  isOwner: boolean;
  isInherited: boolean;
  explicitPermissions: DrivePermission[];
  inheritedPermissions: DrivePermission[];
  riskLevel: ResourceSecurityClassification["permissionRisk"];
  canShare: boolean;
  canDelete: boolean;
}

export class DrivePermissionInspector {
  /**
   * Analyzes the effective permissions for a specific identity on a Drive resource.
   * This is a read-only operation that projects current ACLs into a simplified analysis.
   */
  static analyze(resource: DriveResource, identityEmail: string): PermissionAnalysis {
    const allPermissions = resource.permissions || [];
    
    // 1. Check for direct ownership
    const isOwner = resource.owners.includes(identityEmail);
    
    // 2. Find explicit permission for this user
    const explicit = allPermissions.filter(p => p.email === identityEmail);
    
    // 3. Determine inherited permissions (simulation: if not explicit, check inherited flag)
    const inherited = resource.inheritedPermissions ? allPermissions.filter(p => p.type !== 'user') : [];

    // 4. Calculate effective role (Priority: Owner > Explicit > Inherited > Viewer)
    let effectiveRole = "viewer";
    if (isOwner) {
      effectiveRole = "owner";
    } else if (explicit.length > 0) {
      effectiveRole = explicit[0].role;
    } else if (inherited.length > 0) {
      effectiveRole = inherited[0].role;
    }

    // 5. Determine risk and capabilities based on role
    const roleCapabilities: Record<string, { canShare: boolean; canDelete: boolean; risk: any }> = {
      owner: { canShare: true, canDelete: true, risk: "none" },
      writer: { canShare: false, canDelete: false, risk: "low" },
      commenter: { canShare: false, canDelete: false, risk: "none" },
      viewer: { canShare: false, canDelete: false, risk: "none" },
    };

    const caps = roleCapabilities[effectiveRole] || { canShare: false, canDelete: false, risk: "medium" };

    return {
      effectiveRole,
      isOwner,
      isInherited: explicit.length === 0 && inherited.length > 0,
      explicitPermissions: explicit,
      inheritedPermissions: inherited,
      riskLevel: caps.risk,
      canShare: caps.canShare,
      canDelete: caps.canDelete,
    };
  }
}
