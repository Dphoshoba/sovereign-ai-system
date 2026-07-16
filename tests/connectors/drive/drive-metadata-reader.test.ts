import { describe, it, expect } from 'vitest';
import { DriveMetadataReader } from '../../lib/connectors/drive/metadata-reader';
import { DriveFixtures } from '../fixtures/drive/drive-fixtures';

describe('Drive Metadata Reader', () => {
  it('correctly parses and classifies a standard file', () => {
    const raw = {
      id: 'file-123',
      name: 'Project Plan',
      mimeType: 'application/vnd.google-apps.document',
      createdTime: '2026-01-01T00:00:00Z',
      modifiedTime: '2026-01-02T00:00:00Z',
      size: 1024,
      owners: ['owner@example.com'],
      permissions: [
        { id: 'p1', role: 'owner', type: 'user', email: 'owner@example.com' }
      ],
      parents: ['folder-1'],
    };

    const { resource, security } = DriveMetadataReader.readMetadata(raw);

    expect(resource.id).toBe('file-123');
    expect(resource.name).toBe('Project Plan');
    expect(security.classification).toBe('restricted');
    expect(security.ownerType).toBe('personal');
  });

  it('classifies a public file as public', () => {
    const raw = {
      id: 'file-pub',
      name: 'Public Doc',
      mimeType: 'application/pdf',
      permissions: [
        { id: 'p2', role: 'viewer', type: 'anyone' }
      ],
    };

    const { security } = DriveMetadataReader.readMetadata(raw);
    expect(security.classification).toBe('public');
    expect(security.publicExposure).toBe(true);
  });

  it('classifies a sensitive file based on content keywords', () => {
    const raw = {
      id: 'file-secret',
      name: 'Confidential Roadmap',
      mimeType: 'application/vnd.google-apps.document',
      permissions: [],
    };

    const { security } = DriveMetadataReader.readMetadata(raw);
    expect(security.classification).toBe('sensitive');
    expect(security.sensitivityScore).toBe(90);
  });

  it('strictly prohibits content retrieval fields', () => {
    const raw = {
      id: 'file-1',
      name: 'Test',
      content: 'SECRET DATA',
      downloadUrl: 'http://download.me',
      thumbnail: 'http://thumb.me',
    };

    const { resource } = DriveMetadataReader.readMetadata(raw);
    
    expect(resource).not.toHaveProperty('content');
    expect(resource).not.toHaveProperty('downloadUrl');
    expect(resource).not.toHaveProperty('thumbnail');
  });

  it('maintains determinism across identical inputs', () => {
    const raw = { id: 'f1', name: 'A' };
    const res1 = DriveMetadataReader.readMetadata(raw);
    const res2 = DriveMetadataReader.readMetadata(raw);

    expect(res1).toEqual(res2);
  });

  it('handles missing optional fields gracefully', () => {
    const raw = { id: 'f2', name: 'B' };
    const { resource } = DriveMetadataReader.readMetadata(raw);
    
    expect(resource.size).toBeNull();
    expect(resource.checksum).toBeNull();
    expect(resource.permissions).toEqual([]);
  });
});
