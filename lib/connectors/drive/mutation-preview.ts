import type { DriveResource } from "./resource-parser";
import type { ResourceSecurityClassification } from "../../platform/security/resource-security-types";

export interface MutationPreview {
  previewId: string;
  connectorId: string;
  operation: string;
  resourceId?: string;
  sourceParentId?: string;
  destinationParentId?: string;
  beforeState?: DriveResource;
  proposedState?: DriveResource;
  security: {
    classification: ResourceSecurityClassification;
    mimeClassification: string;
    ownershipAnalysis: {
      currentOwner: string | null;
      proposedOwner: string | null;
    };
    currentPermissions: any[];
    proposedPermissionDelta: any[];
    externalSharingImpact: string;
    publicExposureImpact: string;
    sensitiveResourceImpact: string;
  };
  governance: {
    duplicateConflictFindings: any[];
    versionImpact: any;
    validationErrors: string[];
    blockingReasons: string[];
    warnings: string[];
    requiredScopes: string[];
    requiredApproval: string;
    riskFactors: string[];
  };
  execution: {
    estimatedApiOperation: string;
    changeSummary: string;
    previewOnly: true;
    executionAllowed: false;
    liveExecutionAuthorized: false;
  };
}
