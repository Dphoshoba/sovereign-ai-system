/**
 * Preview Engine
 * Generates safe previews for draft approval
 */

import {
  DraftPreview,
  PreviewGenerationRequest,
  PreviewGenerationResponse,
  SafeHtmlRender,
  BodyPreviewOptions,
  DEFAULT_PREVIEW_CONFIG,
} from '../../../src/lib/draft-preview/types';
import { DraftComposition } from '../../../src/lib/gmail-drafts/types';

export class PreviewEngine {
  /**
   * Generate preview from draft composition
   */
  generatePreview(request: PreviewGenerationRequest): PreviewGenerationResponse {
    try {
      const { draft, expirationDays = 7 } = request;

      // Validate draft
      if (!draft || !draft.validation.valid) {
        return {
          success: false,
          error: 'Draft validation failed - cannot preview invalid draft',
        };
      }

      // Generate preview ID
      const previewId = `preview_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Generate body preview
      const bodyPreview = this.generateBodyPreview(draft, {
        maxLength: 500,
        sanitizeHtml: true,
      });

      // Generate HTML preview (safe)
      const htmlPreviewRaw = draft.request.html ? this.sanitizeHtml(draft.request.html) : undefined;
      const htmlPreview = htmlPreviewRaw?.sanitized;

      // Calculate attachment summary
      const attachmentSummary = {
        count: draft.request.attachments?.length || 0,
        totalSize: draft.request.attachments?.reduce((sum, att) => sum + att.size, 0) || 0,
        types: draft.request.attachments?.map(att => att.mimeType) || [],
        names: draft.request.attachments?.map(att => att.filename) || [],
      };

      // Get validation warnings (filter non-errors)
      const validationWarnings = draft.validation.issues
        .filter(issue => issue.severity !== 'error')
        .map(issue => ({
          severity: issue.severity as 'info' | 'warning',
          message: issue.message,
          field: issue.field,
          suggestion: issue.suggestion,
        }));

      // Create preview
      const preview: DraftPreview = {
        id: previewId,
        draftId: draft.id,
        to: draft.request.to,
        cc: draft.request.cc,
        bcc: draft.request.bcc,
        subject: draft.request.subject,
        bodyPreview,
        htmlPreview,
        attachmentSummary,
        riskScore: draft.riskAssessment.score,
        riskLevel: draft.riskAssessment.riskLevel,
        validationWarnings,
        estimatedSize: draft.validation.estimatedSize,
        auditSummary: {
          composed: draft.createdAt,
          previewGenerated: new Date(),
          composerEmail: draft.request.customHeaders?.From || 'unknown@example.com',
          draftVersion: 1,
        },
        createdAt: new Date(),
        expiresAt,
        status: 'active',
      };

      return {
        success: true,
        preview,
      };
    } catch (error) {
      return {
        success: false,
        error: `Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate safe body preview
   */
  private generateBodyPreview(draft: DraftComposition, options: BodyPreviewOptions): string {
    const maxLength = options.maxLength || 500;

    // Prefer HTML if available, fall back to text
    let content = draft.request.html || draft.request.text || '';

    // Strip HTML tags if needed
    if (options.sanitizeHtml && content.includes('<')) {
      content = content.replace(/<[^>]*>/g, '').trim();
    }

    // Truncate to max length
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    return content;
  }

  /**
   * Sanitize HTML for safe preview rendering
   */
  private sanitizeHtml(html: string): SafeHtmlRender {
    let sanitized = html;
    let scriptsRemoved = 0;
    let externalLinksBlocked = 0;
    let embeddedContentStripped = 0;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, () => {
      scriptsRemoved++;
      return '';
    });

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, () => {
      scriptsRemoved++;
      return '';
    });

    // Block external links (make them plain text)
    sanitized = sanitized.replace(
      /<a\s+href\s*=\s*["']?(https?|ftp):\/\/[^"'>\s]+/gi,
      () => {
        externalLinksBlocked++;
        return '';
      }
    );

    // Remove iframe, embed, object tags
    sanitized = sanitized.replace(
      /<(iframe|embed|object)[^>]*(?:>(?:<\/\1>)?|\/?>)/gi,
      () => {
        embeddedContentStripped++;
        return '';
      }
    );

    return {
      sanitized,
      scripts_removed: scriptsRemoved,
      external_links_blocked: externalLinksBlocked,
      embedded_content_stripped: embeddedContentStripped,
    };
  }

  /**
   * Check if preview is expired
   */
  isExpired(preview: DraftPreview): boolean {
    return new Date() > preview.expiresAt;
  }

  /**
   * Mark preview as archived
   */
  archivePreview(preview: DraftPreview): DraftPreview {
    return {
      ...preview,
      status: 'archived',
    };
  }

  /**
   * Calculate preview risk score
   */
  calculateRiskScore(draft: DraftComposition): number {
    return draft.riskAssessment.score;
  }

  /**
   * Determine if preview needs attention
   */
  needsAttention(preview: DraftPreview): boolean {
    return (
      preview.riskLevel === 'high' ||
      preview.riskLevel === 'critical' ||
      preview.validationWarnings.some(w => w.severity === 'warning')
    );
  }

  /**
   * Generate summary for audit trail
   */
  generateAuditSummary(preview: DraftPreview): Record<string, any> {
    return {
      previewId: preview.id,
      draftId: preview.draftId,
      riskLevel: preview.riskLevel,
      recipientCount: preview.to.length + (preview.cc?.length || 0),
      hasAttachments: preview.attachmentSummary.count > 0,
      estimatedSize: preview.estimatedSize,
      validationIssues: preview.validationWarnings.length,
      timestamp: new Date(),
    };
  }
}
