import { describe, it, expect } from 'vitest';
import { DriveMutationPreviewer } from '../../../lib/connectors/drive/mutation-previewer';
import { DriveParser } from '../../../lib/connectors/drive/resource-parser';

describe('Drive Stage 2A Mutation Previews - Comprehensive Suite', () => {
  const ctx = { userId: 'user-1', token: 'tok-1' };
  const requestId = 'req-stable-123';

  describe('Serialization & Determinism', () => {
    it('guarantees byte-for-byte identical JSON for identical inputs', async () => {
      const params = { requestId, operation: 'upload', name: 'Doc.pdf', parentId: 'f1' };
      const p1 = await DriveMutationPreviewer.generatePreview('upload', params, ctx);
      const p2 = await DriveMutationPreviewer.generatePreview('upload', params, ctx);
      expect(JSON.stringify(p1)).toBe(JSON.stringify(p2));
    });

    it('is a pure serializable data object (no functions, dates, or classes)', async () => {
      const params = { requestId, operation: 'upload', name: 'Doc.pdf', parentId: 'f1' };
      const preview = await DriveMutationPreviewer.generatePreview('upload', params, ctx);
      const json = JSON.stringify(preview);
      const parsed = JSON.parse(json);
      
      expect(parsed).toEqual(preview);
      
      // check proposedState (always present for upload)
      expect(typeof parsed.proposedState?.createdAt).toBe('string'); 
      
      // check beforeState if it exists (e.g. for a rename)
      const renameParams = { requestId, resourceId: 'f1', operation: 'rename', name: 'New.pdf' };
      const renamePreview = await DriveMutationPreviewer.generatePreview('rename', renameParams, ctx);
      const renameParsed = JSON.parse(JSON.stringify(renamePreview));
      expect(typeof renameParsed.beforeState?.createdAt).toBe('string');
    });
  });

  describe('Upload & Create Folder', () => {
    it('validates successful upload preview', async () => {
      const params = { requestId, operation: 'upload', name: 'New.pdf', parentId: 'folder-1', size: 500 };
      const preview = await DriveMutationPreviewer.generatePreview('upload', params, ctx);
      expect(preview.operation).toBe('upload');
      expect(preview.proposedState.name).toBe('New.pdf');
      expect(preview.proposedState.parents).toContain('folder-1');
      expect(preview.execution.executionAllowed).toBe(false);
    });

    it('blocks upload missing name or parent', async () => {
      const params = { requestId, operation: 'upload' };
      const preview = await DriveMutationPreviewer.generatePreview('upload', params, ctx);
      expect(preview.governance.validationErrors).toContain('Missing proposed filename');
      expect(preview.governance.validationErrors).toContain('Missing target parent');
    });

    it('validates folder creation with parent', async () => {
      const params = { requestId, operation: 'createFolder', name: 'New Folder', parentId: 'f1' };
      const preview = await DriveMutationPreviewer.generatePreview('createFolder', params, ctx);
      expect(preview.proposedState.name).toBe('New Folder');
      expect(preview.execution.estimatedApiOperation).toBe('files.create');
    });
  });

  describe('Rename, Move, Copy', () => {
    it('detects naming conflicts during rename', async () => {
      const params = { requestId, resourceId: 'f1', operation: 'rename', name: 'CONFLICT_FILE.pdf' };
      const preview = await DriveMutationPreviewer.generatePreview('rename', params, ctx);
      expect(preview.governance.blockingReasons).toContain('Naming conflict detected at destination');
    });

    it('detects folder cycles during move', async () => {
      const params = { requestId, resourceId: 'f1', operation: 'move', destinationParentId: 'f1' };
      const preview = await DriveMutationPreviewer.generatePreview('move', params, ctx);
      expect(preview.governance.blockingReasons).toContain('Cycle detected: destination is the resource itself');
    });

    it('validates copy preview a destination parent', async () => {
      const params = { requestId, resourceId: 'f1', operation: 'copy', parentId: 'f2' };
      const preview = await DriveMutationPreviewer.generatePreview('copy', params, ctx);
      expect(preview.operation).toBe('copy');
      expect(preview.proposedState.parents).toContain('f2');
    });
  });

  describe('Trash & Restore', () => {
    it('projects trash state as effectively trashed', async () => {
      const params = { requestId, resourceId: 'f1', operation: 'trash' };
      const preview = await DriveMutationPreviewer.generatePreview('trash', params, ctx);
      expect(preview.proposedState.effectivePermissions).toBe('trashed');
    });

    it('validates restore eligibility', async () => {
      const params = { requestId, resourceId: 'f1', operation: 'restore' };
      const preview = await DriveMutationPreviewer.generatePreview('restore', params, ctx);
      expect(preview.proposedState.effectivePermissions).toBe('owner');
    });
  });

  describe('Permissions & Sharing', () => {
    it('blocks owner transfer', async () => {
      const params = { 
        requestId, 
        resourceId: 'f1', 
        operation: 'permissionChange', 
        proposedPermissions: [{ email: 'new@ex.com', role: 'owner' }] 
      };
      const preview = await DriveMutationPreviewer.generatePreview('permissionChange', params, ctx);
      expect(preview.governance.blockingReasons).toContain('Owner transfer is prohibited via this interface');
    });

    it('flags public exposure risk', async () => {
      const params = { 
        requestId, 
        resourceId: 'f1', 
        operation: 'sharingChange', 
        proposedPermissions: [{ email: 'anyone', role: 'anyoneWithLink' }] 
      };
      const preview = await DriveMutationPreviewer.generatePreview('sharingChange', params, ctx);
      expect(preview.governance.riskFactors).toContain('Operation will create a public exposure of the resource');
    });

    it('computes a deterministic permission delta', async () => {
      const params = { 
        requestId, 
        resourceId: 'f1', 
        operation: 'permissionChange', 
        proposedPermissions: [
          { email: 'b@ex.com', role: 'writer' },
          { email: 'a@ex.com', role: 'viewer' }
        ] 
      };
      const preview = await DriveMutationPreviewer.generatePreview('permissionChange', params, ctx);
      // Should be sorted by user email
      expect(preview.security.proposedPermissionDelta[0].user).toBe('a@ex.com');
      expect(preview.security.proposedPermissionDelta[1].user).toBe('b@ex.com');
    });
  });

  describe('Safety Constraints', () => {
    it('ensures executionAllowed is always false in previews', async () => {
      const params = { requestId, operation: 'upload', name: 'T.pdf', parentId: 'f1' };
      const preview = await DriveMutationPreviewer.generatePreview('upload', params, ctx);
      expect(preview.execution.executionAllowed).toBe(false);
      expect(preview.execution.liveExecutionAuthorized).toBe(false);
      expect(preview.execution.previewOnly).toBe(true);
    });

    it('prohibits execution without requestId', async () => {
      const params = { operation: 'upload', name: 'T.pdf' };
      await expect(DriveMutationPreviewer.generatePreview('upload', params, ctx))
        .rejects.toThrow('requestId is required');
    });
  });
});
