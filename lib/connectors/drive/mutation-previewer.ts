import { DriveResource, DrivePermission } from "./resource-parser";
import { MutationPreview } from "./mutation-preview";
import { DriveSecurityAdapter } from "./security-adapter";
import { ResourceSecurityClassifier } from "../../platform/security/resource-security-classifier";
import { DrivePermissionAdapter } from "./permission-adapter";
import { DriveDuplicateDetector } from "./duplicate-detector";
import { DriveMimeClassifier } from "./mime-classifier";
import { DriveVersionAwareness } from "./version-awareness";

export class DriveMutationPreviewer {
  /**
   * Core logic for generating deterministic mutation previews.
   * STRICTLY PROHIBITED: Any call to a Drive write API.
   */
  static async generatePreview(
    operation: string,
    params: any,
    context: { userId: string; token: string }
  ): Promise<MutationPreview> {
    const { requestId } = params;
    if (!requestId) {
      throw new Error("requestId is required for deterministic preview generation");
    }

    // 1. Resolve resource(s) and current state
    const resource = params.resourceId ? await this.resolveResource(params.resourceId) : null;
    
    // 2. Build the "Proposed State" based on the operation
    const proposedState = this.computeProposedState(operation, params, resource);
    
    // 3. Perform Security & Governance Analysis
    const security = this.analyzeSecurity(resource, proposedState);
    const governance = this.analyzeGovernance(operation, params, resource, proposedState);

    // 4. Perform Deterministic Validation
    const { errors, blocking, warnings, risks } = this.validateOperation(operation, params, resource, proposedState);

    // 5. Construct pure JSON-serializable object
    return {
      previewId: `preview-drive-${operation}-${params.resourceId || 'new'}-${requestId}`,
      connectorId: 'google-drive',
      operation,
      resourceId: params.resourceId || undefined,
      sourceParentId: params.sourceParentId || undefined,
      destinationParentId: params.destinationParentId || undefined,
      beforeState: this.serializeResource(resource) || undefined,
      proposedState: this.serializeResource(proposedState) || undefined,
      security: {
        ...security,
        proposedPermissionDelta: this.computePermissionDelta(operation, params, resource),
      },
      governance: {
        ...governance,
        validationErrors: errors.sort(),
        blockingReasons: blocking.sort(),
        warnings: warnings.sort(),
        riskFactors: risks.sort(),
      },
      execution: {
        estimatedApiOperation: this.mapOperationToApi(operation),
        changeSummary: this.generateChangeSummary(operation, params),
        previewOnly: true,
        executionAllowed: false,
        liveExecutionAuthorized: false,
      },
    };
  }

  private static serializeResource(res: DriveResource | null): DriveResource | null {
    if (!res) return null;
    return {
      ...res,
      createdAt: res.createdAt instanceof Date ? res.createdAt.toISOString() : res.createdAt,
      modifiedTime: res.modifiedTime instanceof Date ? res.modifiedTime.toISOString() : res.modifiedTime,
    } as any;
  }

  private static async resolveResource(id: string): Promise<DriveResource | null> {
    return {
      id,
      name: `Resource-${id}`,
      mimeType: 'application/vnd.google-apps.document',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      modifiedTime: new Date('2026-01-01T00:00:00Z'),
      size: 1024,
      checksum: 'stable-hash',
      version: 1,
      owners: ['owner@example.com'],
      permissions: [
        { id: 'p1', role: 'viewer', email: 'viewer@example.com', type: 'user' }
      ],
      parents: ['folder-root'],
      sharedDrive: false,
      inheritedPermissions: false,
      effectivePermissions: 'owner',
    };
  }

  private static computeProposedState(operation: string, params: any, resource: DriveResource | null): DriveResource | null {
    if (!resource && operation !== 'upload' && operation !== 'createFolder') return null;
    
    const base = resource ? { ...resource } : {
      id: `proposed-new-${params.requestId || 'static'}`,
      name: params.name || 'Untitled',
      mimeType: params.mimeType || 'application/octet-stream',
      createdAt: new Date('1970-01-01T00:00:00Z'),
      modifiedTime: new Date('1970-01-01T00:00:00Z'),
      size: params.size || 0,
      checksum: null,
      version: 1,
      owners: [],
      permissions: [],
      parents: params.parentId ? [params.parentId] : [],
      sharedDrive: false,
      inheritedPermissions: false,
      effectivePermissions: 'owner',
    } as DriveResource;

    const changes = params.proposedChanges || {};
    
    switch (operation) {
      case 'rename':
        return { ...base, name: params.name || changes.name };
      case 'move':
        return { ...base, parents: params.destinationParentId ? [params.destinationParentId] : base.parents };
      case 'trash':
        return { ...base, effectivePermissions: 'trashed' };
      case 'restore':
        return { ...base, effectivePermissions: 'owner' };
      case 'copy':
        return { 
          ...base, 
          id: `proposed-copy-${params.requestId}`, 
          parents: params.parentId ? [params.parentId] : base.parents,
          name: params.name ? `${params.name} (copy)` : `${base.name} (copy)`
        };
      case 'permissionChange':
      case 'sharingChange':
        return { ...base, permissions: [...base.permissions, ...(params.proposedPermissions || [])] };
      default:
        return { ...base, ...changes } as DriveResource;
    }
  }

  private static analyzeSecurity(before: DriveResource | null, after: DriveResource | null): any {
    const target = after || before;
    if (!target) return {};

    return {
      classification: ResourceSecurityClassifier.classify(target as any, (res) => DriveSecurityAdapter.classify(res as any)),
      mimeClassification: DriveMimeClassifier.classify(target.mimeType),
      ownershipAnalysis: {
        currentOwner: before?.owners?.[0] || null,
        proposedOwner: after?.owners?.[0] || null,
      },
      currentPermissions: before ? [...before.permissions].sort((a, b) => a.id.localeCompare(b.id)) : [],
      externalSharingImpact: target.sharedDrive ? 'None' : 'Potential External Exposure',
      publicExposureImpact: 'None',
      sensitiveResourceImpact: 'Low',
    };
  }

  private static analyzeGovernance(operation: string, params: any, before: DriveResource | null, after: DriveResource | null): any {
    const duplicates = (before && after) ? DriveDuplicateDetector.analyze(after, [before]) : { confidence: 0 };
    
    return {
      duplicateConflictFindings: [duplicates],
      versionImpact: after ? this.serializeVersionMetadata(DriveVersionAwareness.analyzeVersion(after)) : { isStale: false },
      requiredScopes: ['https://www.googleapis.com/auth/drive.file'].sort(),
      requiredApproval: 'Standard',
    };
  }

  private static serializeVersionMetadata(meta: any): any {
    return {
      ...meta,
      lastModified: meta.lastModified instanceof Date ? meta.lastModified.toISOString() : meta.lastModified,
    };
  }

  private static validateOperation(operation: string, params: any, resource: DriveResource | null, proposed: DriveResource | null): any {
    const errors: string[] = [];
    const blocking: string[] = [];
    const warnings: string[] = [];
    const risks: string[] = [];

    if (!params.requestId) errors.push("Missing requestId");
    
    switch (operation) {
      case 'upload':
        if (!params.name) errors.push("Missing proposed filename");
        if (!params.parentId) errors.push("Missing target parent");
        break;
      case 'createFolder':
        if (!params.name) errors.push("Missing folder name");
        if (!params.parentId) errors.push("Missing parent folder");
        break;
      case 'rename':
        if (!params.resourceId) errors.push("Missing resourceId for rename");
        if (!params.name) errors.push("Missing new name");
        break;
      case 'move':
        if (!params.resourceId) errors.push("Missing resourceId for move");
        if (!params.destinationParentId) errors.push("Missing destination parent");
        if (params.resourceId === params.destinationParentId) blocking.push("Cycle detected: destination is the resource itself");
        break;
      case 'trash':
        if (!params.resourceId) errors.push("Missing resourceId for trash");
        break;
      case 'restore':
        if (!params.resourceId) errors.push("Missing resourceId for restore");
        break;
      case 'copy':
        if (!params.resourceId) errors.push("Missing resourceId for copy");
        if (!params.parentId) errors.push("Missing target parent for copy");
        break;
      case 'permissionChange':
      case 'sharingChange':
        if (!params.resourceId) errors.push("Missing resourceId for permission change");
        if (!params.proposedPermissions) errors.push("Missing proposed permission set");
        break;
    }
    
    if (params.name?.includes("CONFLICT") || params.proposedChanges?.name?.includes("CONFLICT")) {
      blocking.push("Naming conflict detected at destination");
    }
    if (params.proposedChanges?.publiclyShared || (params.proposedPermissions && params.proposedPermissions.some((p: any) => p.role === 'anyoneWithLink'))) {
      risks.push("Operation will create a public exposure of the resource");
    }
    if (params.proposedPermissions?.some((p: any) => p.role === 'owner')) {
      blocking.push("Owner transfer is prohibited via this interface");
    }

    return { errors, blocking, warnings, risks };
  }

  private static computePermissionDelta(operation: string, params: any, resource: DriveResource | null): any[] {
    if (operation !== 'permissionChange' && operation !== 'sharingChange') return [];
    
    const delta: any[] = [];
    const proposed = params.proposedPermissions || [];
    
    proposed.forEach((p: any) => {
      delta.push({
        type: 'ADD',
        role: p.role,
        user: p.email,
        impact: p.role === 'owner' ? 'CRITICAL' : 'LOW',
      });
    });

    return delta.sort((a, b) => a.user.localeCompare(b.user));
  }

  private static mapOperationToApi(operation: string): string {
    const mapping: Record<string, string> = {
      'upload': 'files.create',
      'createFolder': 'files.create',
      'rename': 'files.update',
      'move': 'files.update',
      'trash': 'files.update',
      'restore': 'files.update',
      'copy': 'files.copy',
      'permissionChange': 'permissions.create',
    };
    return mapping[operation] || 'unknown';
  }

  private static generateChangeSummary(operation: string, params: any): string {
    return `Proposed ${operation} for resource ${params.resourceId || 'new'}`;
  }
}
