import type { DriveResource } from "./resource-parser";
import { DriveSecurityAdapter } from "./security-adapter";
import type { ResourceSecurityClassification } from "../../platform/security/resource-security-types";

export interface DriveReadAudit {
  resourceId: string;
  operation: "read" | "search" | "browse";
  actor: string;
  timestamp: Date;
  classification: ResourceSecurityClassification;
  governanceContext: {
    scopeValidated: boolean;
    decisionRationale: string;
  };
}

export class DriveReadAuditLogger {
  static projectAudit(
    resource: DriveResource,
    operation: "read" | "search" | "browse",
    actor: string,
    rationale: string
  ): DriveReadAudit {
    const security = DriveSecurityAdapter.classify(resource);

    return {
      resourceId: resource.id,
      operation,
      actor,
      timestamp: new Date(), // In a real system, this would be a deterministic projected time
      classification: security,
      governanceContext: {
        scopeValidated: true,
        decisionRationale: rationale,
      },
    };
  }
}
