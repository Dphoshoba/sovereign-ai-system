/**
 * Draft Validator
 * Comprehensive validation for draft composition
 */

import {
  DraftRequest,
  ValidationReport,
  ValidationIssue,
  ComposerConfig,
  DEFAULT_COMPOSER_CONFIG,
} from '../../../src/lib/gmail-drafts/types';

export class DraftValidator {
  private config: ComposerConfig;

  constructor(config: Partial<ComposerConfig> = {}) {
    this.config = { ...DEFAULT_COMPOSER_CONFIG, ...config };
  }

  /**
   * Validate draft request
   */
  validate(request: DraftRequest): ValidationReport {
    const issues: ValidationIssue[] = [];

    // Validate recipients
    issues.push(...this.validateRecipients(request));

    // Validate content
    issues.push(...this.validateContent(request));

    // Validate attachments
    issues.push(...this.validateAttachments(request));

    // Validate for forbidden content
    issues.push(...this.validateForbiddenContent(request));

    // Calculate metrics
    const estimatedSize = this.calculateSize(request);
    const attachmentCount = request.attachments?.length || 0;
    const recipientCount = this.countRecipients(request);

    // Determine confidence based on issues
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const confidence = errorCount > 0 ? 0.0 : 0.95 - issues.length * 0.05;

    const valid = issues.every(i => i.severity !== 'error');

    return {
      valid,
      issues,
      estimatedSize,
      attachmentCount,
      recipientCount,
      confidence: Math.max(0, confidence),
    };
  }

  /**
   * Validate recipient email addresses
   */
  private validateRecipients(request: DraftRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check TO field
    if (!request.to || request.to.length === 0) {
      issues.push({
        severity: 'error',
        field: 'to',
        message: 'At least one recipient (TO) is required',
      });
    } else {
      for (const email of request.to) {
        if (!this.isValidEmail(email)) {
          issues.push({
            severity: 'error',
            field: 'to',
            message: `Invalid email address: ${email}`,
            suggestion: 'Check email format (user@domain.com)',
          });
        }
      }

      if (request.to.length > this.config.maxRecipients) {
        issues.push({
          severity: 'error',
          field: 'to',
          message: `Too many recipients: ${request.to.length} (max ${this.config.maxRecipients})`,
        });
      }
    }

    // Check CC field
    if (request.cc) {
      for (const email of request.cc) {
        if (!this.isValidEmail(email)) {
          issues.push({
            severity: 'error',
            field: 'cc',
            message: `Invalid email address in CC: ${email}`,
          });
        }
      }
    }

    // Check BCC field
    if (request.bcc) {
      for (const email of request.bcc) {
        if (!this.isValidEmail(email)) {
          issues.push({
            severity: 'error',
            field: 'bcc',
            message: `Invalid email address in BCC: ${email}`,
          });
        }
      }
    }

    // Warn about BCC usage
    if (request.bcc && request.bcc.length > 0) {
      issues.push({
        severity: 'warning',
        field: 'bcc',
        message: 'BCC recipients are hidden - review carefully before sending',
      });
    }

    return issues;
  }

  /**
   * Validate content (subject, body)
   */
  private validateContent(request: DraftRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Subject validation
    if (!request.subject || request.subject.trim().length === 0) {
      issues.push({
        severity: 'error',
        field: 'subject',
        message: 'Subject is required',
      });
    } else if (request.subject.length > this.config.maxSubjectLength) {
      issues.push({
        severity: 'error',
        field: 'subject',
        message: `Subject too long: ${request.subject.length} (max ${this.config.maxSubjectLength})`,
      });
    }

    // Body validation
    const bodyLength = (request.html?.length || 0) + (request.text?.length || 0);

    if (bodyLength === 0) {
      issues.push({
        severity: 'error',
        field: 'body',
        message: 'Email body is empty - provide either text or HTML content',
      });
    } else if (bodyLength > this.config.maxBodyLength) {
      issues.push({
        severity: 'error',
        field: 'body',
        message: `Email body too large: ${bodyLength} bytes (max ${this.config.maxBodyLength})`,
      });
    }

    // Alternative content check
    if (this.config.requireHtmlAlternative && request.html && !request.text) {
      issues.push({
        severity: 'warning',
        field: 'body',
        message: 'HTML content provided but no plain text alternative',
        suggestion: 'Provide plain text version for email clients that don\'t support HTML',
      });
    }

    if (this.config.requireTextAlternative && request.text && !request.html) {
      issues.push({
        severity: 'info',
        field: 'body',
        message: 'Plain text only - consider adding HTML for better formatting',
      });
    }

    return issues;
  }

  /**
   * Validate attachments
   */
  private validateAttachments(request: DraftRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!request.attachments || request.attachments.length === 0) {
      return issues;
    }

    if (request.attachments.length > this.config.maxAttachmentCount) {
      issues.push({
        severity: 'error',
        field: 'attachments',
        message: `Too many attachments: ${request.attachments.length} (max ${this.config.maxAttachmentCount})`,
      });
    }

    let totalSize = 0;

    for (const attachment of request.attachments) {
      // Validate filename
      if (!attachment.filename || attachment.filename.trim().length === 0) {
        issues.push({
          severity: 'error',
          field: 'attachments',
          message: 'Attachment missing filename',
        });
      }

      // Validate MIME type
      if (!this.config.allowedMimeTypes.includes(attachment.mimeType)) {
        issues.push({
          severity: 'error',
          field: 'attachments',
          message: `File type not allowed: ${attachment.mimeType}`,
          suggestion: `Allowed types: ${this.config.allowedMimeTypes.join(', ')}`,
        });
      }

      // Validate individual file size
      if (attachment.size > this.config.maxAttachmentSize) {
        issues.push({
          severity: 'error',
          field: 'attachments',
          message: `Attachment too large: ${attachment.filename} (${this.formatBytes(attachment.size)}, max ${this.formatBytes(this.config.maxAttachmentSize)})`,
        });
      }

      totalSize += attachment.size;
    }

    // Validate total attachment size
    if (totalSize > this.config.maxTotalAttachmentSize) {
      issues.push({
        severity: 'error',
        field: 'attachments',
        message: `Total attachment size too large: ${this.formatBytes(totalSize)} (max ${this.formatBytes(this.config.maxTotalAttachmentSize)})`,
      });
    } else if (totalSize > this.config.maxTotalAttachmentSize * 0.8) {
      issues.push({
        severity: 'warning',
        field: 'attachments',
        message: `Total attachment size approaching limit: ${this.formatBytes(totalSize)} / ${this.formatBytes(this.config.maxTotalAttachmentSize)}`,
      });
    }

    return issues;
  }

  /**
   * Check for forbidden content
   */
  private validateForbiddenContent(request: DraftRequest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const content = (request.subject + ' ' + (request.text || '') + ' ' + (request.html || '')).toLowerCase();

    for (const forbidden of this.config.forbiddenWords) {
      if (content.includes(forbidden.toLowerCase())) {
        issues.push({
          severity: 'warning',
          field: 'content',
          message: `Email contains potentially sensitive word: "${forbidden}"`,
          suggestion: 'Review content carefully before sending',
        });
      }
    }

    return issues;
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional checks
    const [localPart, domain] = email.split('@');

    // Check local part length (max 64)
    if (localPart.length > 64) {
      return false;
    }

    // Check domain length (max 255)
    if (domain.length > 255) {
      return false;
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9.\-_+]+$/.test(localPart)) {
      return false;
    }

    return true;
  }

  /**
   * Count total recipients
   */
  private countRecipients(request: DraftRequest): number {
    let count = request.to?.length || 0;
    count += request.cc?.length || 0;
    count += request.bcc?.length || 0;
    return count;
  }

  /**
   * Calculate estimated MIME size
   */
  private calculateSize(request: DraftRequest): number {
    let size = 0;

    // Headers (~500 bytes base)
    size += 500;

    // Subject
    size += request.subject?.length || 0;

    // Body
    size += request.text?.length || 0;
    size += request.html?.length || 0;

    // Recipients
    size += request.to?.join(',').length || 0;
    size += request.cc?.join(',').length || 0;
    size += request.bcc?.join(',').length || 0;

    // Attachments metadata
    if (request.attachments) {
      for (const att of request.attachments) {
        // Base64 encoded size is ~1.3x larger
        size += Math.ceil(att.size * 1.35);
      }
    }

    return size;
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Helper function to create validator
 */
export function createValidator(config?: Partial<ComposerConfig>): DraftValidator {
  return new DraftValidator(config);
}
