import { describe, it, expect } from 'vitest';
import { DrivePermissionInspector } from '../../../lib/connectors/drive/permission-inspector';
import { DriveParser } from '../../../lib/connectors/drive/resource-parser';

describe('Drive Permission Inspector', () => {
  const mockResource = (overrides: any) => {
    return DriveParser.parse({
      id: 'f1',
      name: 'Test Doc',
      mimeType: 'application/vnd.google-apps.document',
      createdTime: '2026-01-01T00:00:00Z',
      modifiedTime: '2026-01-01T00:00:00Z',
      owners: ['owner@example.com'],
      permissions: [],
      parents: [],
      ...overrides,
    });
  };

  it('identifies the resource owner as having full capabilities', () => {
    const res = mockResource({});
    const analysis = DrivePermissionInspector.analyze(res, 'owner@example.com');
    
    expect(analysis.isOwner).toBe(true);
    expect(analysis.effectiveRole).toBe('owner');
    expect(analysis.canShare).toBe(true);
    expect(analysis.canDelete).toBe(true);
  });

  it('identifies a writer with appropriate role and limited capabilities', () => {
    const res = mockResource({
      permissions: [{ id: 'p1', role: 'writer', type: 'user', email: 'writer@example.com' }]
    });
    const analysis = DrivePermissionInspector.analyze(res, 'writer@example.com');
    
    expect(analysis.isOwner).toBe(false);
    expect(analysis.effectiveRole).toBe('writer');
    expect(analysis.canShare).toBe(false);
    expect(analysis.canDelete).toBe(false);
  });

  it('handles viewer permissions correctly', () => {
    const res = mockResource({
      permissions: [{ id: 'p1', role: 'viewer', type: 'user', email: 'viewer@example.com' }]
    });
    const analysis = DrivePermissionInspector.analyze(res, 'viewer@example.com');
    
    expect(analysis.effectiveRole).toBe('viewer');
    expect(analysis.canShare).toBe(false);
  });

  it('identifies inherited permissions when no explicit match exists', () => {
    const res = mockResource({
      inheritedPermissions: true,
      permissions: [{ id: 'p1', role: 'writer', type: 'domain', email: 'org@example.com' }]
    });
    const analysis = DrivePermissionInspector.analyze(res, 'user@yourdomain.com');
    
    expect(analysis.isInherited).toBe(true);
    expect(analysis.effectiveRole).toBe('writer');
  });

  it('prioritizes explicit permissions over inherited ones', () => {
    const res = mockResource({
      inheritedPermissions: true,
      permissions: [
        { id: 'p1', role: 'viewer', type: 'domain', email: 'org@example.com' },
        { id: 'p2', role: 'writer', type: 'user', email: 'user@example.com' }
      ]
    });
    const analysis = DrivePermissionInspector.analyze(res, 'user@example.com');
    
    expect(analysis.effectiveRole).toBe('writer');
    expect(analysis.isInherited).toBe(false);
  });

  it('defaults to viewer for unknown identities', () => {
    const res = mockResource({});
    const analysis = DrivePermissionInspector.analyze(res, 'stranger@example.com');
    
    expect(analysis.effectiveRole).toBe('viewer');
    expect(analysis.isOwner).toBe(false);
  });

  it('maintains determinism across identical analysis calls', () => {
    const res = mockResource({ permissions: [{ id: 'p1', role: 'writer', type: 'user', email: 'user@example.com' }] });
    const a1 = DrivePermissionInspector.analyze(res, 'user@example.com');
    const a2 = DrivePermissionInspector.analyze(res, 'user@example.com');
    
    expect(a1).toEqual(a2);
  });
});
