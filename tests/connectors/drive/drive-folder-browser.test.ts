import { describe, it, expect } from 'vitest';
import { DriveFolderBrowser } from '../../../lib/connectors/drive/folder-browser';

describe('Drive Folder Browser', () => {
  it('lists root items deterministically', async () => {
    const result = await DriveFolderBrowser.listFolder({ folderId: 'root' });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('Documents');
    expect(result.items[1].name).toBe('Resume.pdf');
  });

  it('lists folder children correctly', async () => {
    const result = await DriveFolderBrowser.listFolder({ folderId: 'f1' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Plan.docx');
  });

  it('returns empty list for unknown folder', async () => {
    const result = await DriveFolderBrowser.listFolder({ folderId: 'unknown' });
    expect(result.items).toHaveLength(0);
  });

  it('enforces maxItems limit', async () => {
    const result = await DriveFolderBrowser.listFolder({ folderId: 'root', maxItems: 1 });
    expect(result.items).toHaveLength(1);
  });

  it('handles trashed items correctly (exclude by default)', async () => {
    const result = await DriveFolderBrowser.listFolder({ folderId: 'root', includeTrashed: false });
    expect(result.items).toHaveLength(2);
  });

  it('maintains stable ordering for the same input', async () => {
    const r1 = await DriveFolderBrowser.listFolder({ folderId: 'root' });
    const r2 = await DriveFolderBrowser.listFolder({ folderId: 'root' });
    expect(r1.items).toEqual(r2.items);
  });

  it('correctly identifies folders vs files', async () => {
    const { items } = await DriveFolderBrowser.listFolder({ folderId: 'root' });
    const folder = items.find(i => i.name === 'Documents');
    const file = items.find(i => i.name === 'Resume.pdf');
    expect(folder?.isFolder).toBe(true);
    expect(file?.isFolder).toBe(false);
  });

  it('strictly prohibits content leakage in results', async () => {
    const { items } = await DriveFolderBrowser.listFolder({ folderId: 'root' });
    items.forEach(item => {
      expect(item).not.toHaveProperty('content');
      expect(item).not.toHaveProperty('downloadUrl');
      expect(item).not.toHaveProperty('exportLink');
    });
  });

  it('provides correct security classification for browser items', async () => {
    const { items } = await DriveFolderBrowser.listFolder({ folderId: 'root' });
    expect(items[0].classification).toBeDefined();
    expect(items[0].classification.classification).toBe('restricted');
  });
});
