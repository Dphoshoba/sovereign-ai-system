import { describe, it, expect } from 'vitest';
import { DriveMetadataReader } from '../../lib/connectors/drive/metadata-reader';

describe('Drive Metadata Reader (legacy suite)', () => {
  it('handles metadata reading', () => {
    const raw = { id: 'f1', name: 'Test' };
    const { resource } = DriveMetadataReader.readMetadata(raw);
    expect(resource.id).toBe('f1');
  });
});
