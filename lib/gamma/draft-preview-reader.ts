/**
 * Draft Preview Reader
 * GAMMA integration for reading and listing draft previews
 */

import { DraftPreview } from '../../src/lib/draft-preview/types';

export class DraftPreviewReader {
  private previews: Map<string, DraftPreview> = new Map();

  /**
   * Store preview
   */
  store(preview: DraftPreview): void {
    this.previews.set(preview.id, preview);
  }

  /**
   * Get preview by ID
   */
  getById(id: string): DraftPreview | undefined {
    return this.previews.get(id);
  }

  /**
   * Get all active previews
   * @param currentTime Current time for deterministic expiration checking
   */
  getActive(currentTime: Date): DraftPreview[] {
    return Array.from(this.previews.values()).filter(p => p.status === 'active' && !this.isExpired(p, currentTime));
  }

  /**
   * Get previews for draft
   */
  getForDraft(draftId: string): DraftPreview[] {
    return Array.from(this.previews.values()).filter(p => p.draftId === draftId);
  }

  /**
   * Get previews by risk level
   */
  getByRiskLevel(level: 'low' | 'medium' | 'high' | 'critical'): DraftPreview[] {
    return Array.from(this.previews.values()).filter(p => p.riskLevel === level && p.status === 'active');
  }

  /**
   * Get previews needing attention
   */
  getNeedingAttention(): DraftPreview[] {
    return Array.from(this.previews.values()).filter(
      p =>
        p.status === 'active' &&
        (p.riskLevel === 'high' || p.riskLevel === 'critical' || p.validationWarnings.length > 0)
    );
  }

  /**
   * Check if preview is expired
   * @param preview Preview to check
   * @param currentTime Current time for comparison
   */
  private isExpired(preview: DraftPreview, currentTime: Date): boolean {
    return currentTime > preview.expiresAt;
  }

  /**
   * Count active previews
   * @param currentTime Current time for deterministic counting
   */
  countActive(currentTime: Date): number {
    return this.getActive(currentTime).length;
  }

  /**
   * Search previews by subject
   */
  searchBySubject(query: string): DraftPreview[] {
    return Array.from(this.previews.values()).filter(p =>
      p.subject.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Search previews by recipient
   */
  searchByRecipient(email: string): DraftPreview[] {
    return Array.from(this.previews.values()).filter(
      p =>
        p.to.some(r => r.includes(email)) ||
        p.cc?.some(r => r.includes(email)) ||
        p.bcc?.some(r => r.includes(email))
    );
  }

  /**
   * Archive old previews
   * @param currentTime Current time for determining expiration
   */
  archiveExpired(currentTime: Date): number {
    let archived = 0;
    for (const preview of this.previews.values()) {
      if (this.isExpired(preview, currentTime) && preview.status === 'active') {
        preview.status = 'expired';
        archived++;
      }
    }
    return archived;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    active: number;
    expired: number;
    archived: number;
    byRisk: Record<string, number>;
  } {
    const all = Array.from(this.previews.values());
    const active = all.filter(p => p.status === 'active').length;
    const expired = all.filter(p => p.status === 'expired').length;
    const archived = all.filter(p => p.status === 'archived').length;

    const byRisk = {
      low: all.filter(p => p.riskLevel === 'low').length,
      medium: all.filter(p => p.riskLevel === 'medium').length,
      high: all.filter(p => p.riskLevel === 'high').length,
      critical: all.filter(p => p.riskLevel === 'critical').length,
    };

    return {
      total: all.length,
      active,
      expired,
      archived,
      byRisk,
    };
  }

  /**
   * Clear all previews (for testing)
   */
  clear(): void {
    this.previews.clear();
  }
}
