export type SecurityClassificationLevel = 
  | "public" 
  | "organization" 
  | "shared" 
  | "restricted" 
  | "sensitive" 
  | "unknown";

export type OwnerType = "personal" | "shared_drive" | "organization" | "unknown";
export type PermissionRisk = "none" | "low" | "medium" | "high" | "critical" | "unknown";

export interface ResourceSecurityClassification {
  classification: SecurityClassificationLevel;
  ownerType: OwnerType;
  permissionRisk: PermissionRisk;
  externalSharing: boolean;
  publicExposure: boolean;
  inheritedPermissions: boolean;
  effectivePermissions: string;
  sensitivityScore: number;
  governanceRisk: string;
}
