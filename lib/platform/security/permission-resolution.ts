export type GammaPermissionRole = 
  | "owner" 
  | "organizer" 
  | "editor" 
  | "contributor" 
  | "commenter" 
  | "reader" 
  | "restricted" 
  | "unknown";

export interface PermissionResolution {
  effectiveRole: GammaPermissionRole;
  isInherited: boolean;
  isOwner: boolean;
  capabilities: {
    canShare: boolean;
    canDelete: boolean;
    canEdit: boolean;
    canComment: boolean;
  };
}

export abstract class PermissionResolutionBase {
  /**
   * Abstract method to be implemented by connector adapters
   * to map native permissions to Gamma permissions.
   */
  abstract resolve(
    resourceMetadata: Record<string, unknown>, 
    identity: string
  ): PermissionResolution;
}
