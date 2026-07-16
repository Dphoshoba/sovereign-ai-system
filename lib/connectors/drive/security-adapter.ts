import { ResourceSecurityClassifier } from "../../platform/security/resource-security-classifier";
import type { ResourceSecurityClassification, PermissionRisk } from "../../platform/security/resource-security-types";
import type { DriveResource } from "./resource-parser";

export const DriveSecurityAdapter = {
  /**
   * Maps Google Drive metadata to the platform-neutral ResourceSecurityClassification.
   */
  classify(resource: DriveResource): ResourceSecurityClassification {
    const permissions = resource.permissions || [];
    const hasAnyone = permissions.some(p => p.type === "anyone");
    const hasDomain = permissions.some(p => p.type === "domain");
    const hasExternal = permissions.some(p => p.type === "user" && p.email && !p.email.endsWith("@yourdomain.com"));
    
    let classification: ResourceSecurityClassification["classification"] = "unknown";
    let permissionRisk: PermissionRisk = "none";
    let governanceRisk = "low";

    if (hasAnyone) {
      classification = "public";
      permissionRisk = "high";
      governanceRisk = "critical";
    } else if (hasDomain) {
      classification = "organization";
      permissionRisk = "medium";
      governanceRisk = "medium";
    } else if (permissions.length > 1) {
      classification = "shared";
      permissionRisk = "low";
      governanceRisk = "low";
    } else {
      classification = "restricted";
      permissionRisk = "none";
      governanceRisk = "low";
    }

    if (resource.mimeType === "application/vnd.google-apps.document" && resource.name.toLowerCase().includes("confidential")) {
      classification = "sensitive";
      permissionRisk = "high";
      governanceRisk = "high";
    }

    return {
      classification,
      ownerType: resource.sharedDrive ? "shared_drive" : (resource.owners.length > 0 ? "personal" : "unknown"),
      permissionRisk,
      externalSharing: hasExternal,
      publicExposure: hasAnyone,
      inheritedPermissions: resource.inheritedPermissions,
      effectivePermissions: resource.effectivePermissions,
      sensitivityScore: classification === "sensitive" ? 90 : (classification === "public" ? 70 : 10),
      governanceRisk,
    };
  },
};
