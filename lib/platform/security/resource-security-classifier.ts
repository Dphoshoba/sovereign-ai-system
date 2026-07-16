import type { ResourceSecurityClassification } from "./resource-security-types";

export class ResourceSecurityClassifier {
  /**
   * Generic platform-level classifier that ensures all connectors 
   * provide a standardized security posture for any given resource.
   */
  static classify(
    resourceMetadata: Record<string, unknown>,
    adapter: (metadata: Record<string, unknown>) => ResourceSecurityClassification
  ): ResourceSecurityClassification {
    try {
      return adapter(resourceMetadata);
    } catch (error) {
      return {
        classification: "unknown",
        ownerType: "unknown",
        permissionRisk: "unknown",
        externalSharing: false,
        publicExposure: false,
        inheritedPermissions: false,
        effectivePermissions: "unknown",
        sensitivityScore: 0,
        governanceRisk: "unknown",
      };
    }
  }
}
