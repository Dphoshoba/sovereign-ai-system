import { describe, it, expect } from 'vitest';
import { DriveVersionAwareness } from '../../lib/connectors/drive/version-awareness';
import { DriveDuplicateDetector } from '../../lib/connectors/drive/duplicate-detector';
import { DriveMimeClassifier } from '../../lib/connectors/drive/mime-classifier';
import { DriveReadAuditLogger } from '../../lib/connectors/drive/read-audit';
import { DriveParser } from '../../lib/connectors/drive/resource-parser';

describe('Drive Stage 1 Advanced Capabilities', () => {
  const mockRes = (overrides = {}) => DriveParser.parse({
    id: 'f1', name: 'Test', mimeType: 'application/pdf',
    createdTime: '2026-01-01T00:00:00Z', modifiedTime: '2026-01-01T00:00:00Z',
    owners: ['me@ex.com'], permissions: [], parents: [],
    ...overrides
  });

  describe('Version Awareness', () => {
    it('detects version drift based on checksum', () => {
      const res = mockRes({ checksum: 'drift_123', version: 1 });
      const analysis = DriveVersionAwareness.analyzeVersion(res);
      expect(analysis.driftDetected).toBe(true);
    });

    it('correctly identifies stale versions', () => {
      const res = mockRes({ version: 5 });
      const analysis = DriveVersionAwareness.analyzeVersion(res);
      expect(analysis.isStale).toBe(true);
    });
  });

  describe('Duplicate Detection', () => {
    it('identifies exact duplicates by checksum', () => {
      const r1 = mockRes({ checksum: 'hash1', size: 100 });
      const r2 = mockRes({ id: 'f2', checksum: 'hash1', size: 100 });
      const analysis = DriveDuplicateDetector.analyze(r1, [r2]);
      expect(analysis.confidence).toBeGreaterThanOrEqual(0.8);
      expect(analysis.duplicateGroupId).toBeDefined();
    });

    it('identifies low-confidence duplicates by name and size', () => {
      const r1 = mockRes({ name: 'Plan', size: 100 });
      const r2 = mockRes({ id: 'f2', name: 'Plan', size: 100 });
      const analysis = DriveDuplicateDetector.analyze(r1, [r2]);
      expect(analysis.confidence).toBeLessThan(0.5);
      expect(analysis.ambiguityWarnings).toContain('Low confidence duplicate detected');
    });
  });

  describe('MIME Classification', () => {
    it('classifies Google Docs as Documents', () => {
      expect(DriveMimeClassifier.classify('application/vnd.google-apps.document')).toBe('Document');
    });
    it('classifies folders correctly', () => {
      expect(DriveMimeClassifier.classify('application/vnd.google-apps.folder')).toBe('Folder');
    });
    it('classifies unknown mimes as Unknown', () => {
      expect(DriveMimeClassifier.classify('application/x-weird')).toBe('Unknown');
    });
  });

  describe('Read Audit', () => {
    it('projects a deterministic read audit record', () => {
      const res = mockRes({});
      const audit = DriveReadAuditLogger.projectAudit(res, 'read', 'user-1', 'Audit test');
      expect(audit.resourceId).toBe('f1');
      expect(audit.operation).toBe('read');
      expect(audit.governanceContext.scopeValidated).toBe(true);
    });
  });
});
