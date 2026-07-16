import { describe, it, expect } from 'vitest';
import { DriveSearch } from '../../lib/connectors/drive/drive-search';

describe('Drive Search', () => {
  it('performs a basic text search deterministically', async () => {
    const result = await DriveSearch.search({ text: 'Resume' });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].resource.name).toBe('Resume.pdf');
  });

  it('filters by MIME type', async () => {
    const result = await DriveSearch.search({ mimeType: 'application/pdf' });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].resource.mimeType).toBe('application/pdf');
  });

  it('filters by owner', async () => {
    const result = await DriveSearch.search({ owner: 'me@ex.com' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('returns an empty list when no matches are found', async () => {
    const result = await DriveSearch.search({ text: 'NonExistentFile' });
    expect(result.results).toHaveLength(0);
  });

  it('maintains stable ordering across identical queries', async () => {
    const r1 = await DriveSearch.search({ text: 'e' });
    const r2 = await DriveSearch.search({ text: 'e' });
    expect(r1.results).toEqual(r2.results);
  });

  it('strictly prohibits content retrieval in search results', async () => {
    const { results } = await DriveSearch.search({ text: 'Resume' });
    results.forEach(res => {
      expect(res.resource).not.toHaveProperty('content');
      expect(res.resource).not.toHaveProperty('downloadUrl');
    });
  });
});
