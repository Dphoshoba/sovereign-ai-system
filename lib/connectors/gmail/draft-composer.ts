/**
 * Draft Composer
 * Orchestrates the complete draft composition workflow
 */

import {
  DraftRequest,
  DraftComposition,
  DraftPreview,
  MimePayload,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  SafetyCheck,
  RecipientValidation,
  ComposerConfig,
  DEFAULT_COMPOSER_CONFIG,
} from '../../../src/lib/gmail-drafts/types';
import { MimeBuilder } from './mime-builder';
import { DraftValidator } from './validator';

export class DraftComposer {
  private config: ComposerConfig;
  private mimeBuilder: MimeBuilder;
  private validator: DraftValidator;
  private draftIdCounter: number = 0;

  constructor(config: Partial<ComposerConfig> = {}) {
    this.config = { ...DEFAULT_COMPOSER_CONFIG, ...config };
    this.mimeBuilder = new MimeBuilder();
    this.validator = new DraftValidator(this.config);
  }

  /**
   * Compose a draft from request
   */
  async composeDraft(
    request: DraftRequest,
    senderEmail: string,
    draftId?: string
  ): Promise<DraftComposition> {
    // Generate unique draft ID if not provided
    if (!draftId) {
      draftId = `draft_${Date.now()}_${++this.draftIdCounter}`;
    }

    // Validate
    const validation = this.validator.validate(request);

    // Build MIME
    const mime = this.mimeBuilder.buildMime(request, senderEmail);

    // Generate preview
    const preview = this.generatePreview(request, draftId, validation);

    // Assess risk
    const riskAssessment = this.assessRisk(request, validation, mime);

    // Create safety checks
    const safetyChecks = this.generateSafetyChecks(request, validation);
    preview.safetyChecks = safetyChecks;

    // Create recipient validation
    const recipientValidation = this.validateRecipients(request);
    preview.recipientValidation = recipientValidation;

    return {
      id: draftId,
      status: 'draft',
      request,
      validation,
      mime,
      preview,
      riskAssessment,
      createdAt: new Date(),
    };
  }

  /**
   * Generate preview for approval
   */
  private generatePreview(
    request: DraftRequest,
    draftId: string,
    validation: any
  ): DraftPreview {
    const riskLevel = this.estimateRiskLevel(request);

    return {
      id: draftId,
      to: request.to,
      cc: request.cc,
      bcc: request.bcc,
      subject: request.subject,
      bodyPreview: this.createBodyPreview(request),
      htmlPreview: request.html ? this.createHtmlPreview(request.html) : undefined,
      attachments: request.attachments || [],
      estimatedSize: validation.estimatedSize,
      riskLevel,
      warnings: validation.issues.filter((i: any) => i.severity !== 'error'),
      safetyChecks: [],
      recipientValidation: [],
    };
  }

  /**
   * Create plain text body preview
   */
  private createBodyPreview(request: DraftRequest): string {
    const text = request.text || request.html || '';
    if (text.length > 300) {
      return text.substring(0, 297) + '...';
    }
    return text;
  }

  /**
   * Create sanitized HTML preview
   */
  private createHtmlPreview(html: string): string {
    // Strip dangerous tags but keep structure
    let safe = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers

    if (safe.length > 500) {
      safe = safe.substring(0, 497) + '...';
    }

    return safe;
  }

  /**
   * Generate safety checks for preview
   */
  private generateSafetyChecks(request: DraftRequest, validation: any): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    // Valid recipients
    checks.push({
      name: 'Valid recipients',
      passed: validation.issues.filter((i: any) => i.field === 'to' && i.severity === 'error').length === 0,
      message: validation.recipientCount > 0 ? `${validation.recipientCount} recipient(s)` : undefined,
    });

    // Subject present
    checks.push({
      name: 'Subject not empty',
      passed: !!request.subject && request.subject.trim().length > 0,
      message: request.subject || 'Subject required',
    });

    // Body present
    checks.push({
      name: 'Body content present',
      passed: !!(request.text || request.html),
      message: (request.text?.length || 0) + (request.html?.length || 0) + ' characters',
    });

    // No forbidden content
    const forbiddenIssues = validation.issues.filter((i: any) => i.field === 'content');
    checks.push({
      name: 'No forbidden content',
      passed: forbiddenIssues.length === 0,
      message: forbiddenIssues.length > 0 ? 'Review warnings' : 'Clean',
    });

    // Attachment limits
    checks.push({
      name: 'Attachments within limits',
      passed: validation.issues.filter((i: any) => i.field === 'attachments' && i.severity === 'error').length === 0,
      message: `${validation.attachmentCount} attachment(s)`,
    });

    // Size acceptable
    const sizeOk = validation.estimatedSize < 25 * 1024 * 1024; // 25 MB
    checks.push({
      name: 'Email size acceptable',
      passed: sizeOk,
      message: this.formatBytes(validation.estimatedSize),
    });

    return checks;
  }

  /**
   * Validate individual recipients
   */
  private validateRecipients(request: DraftRequest): RecipientValidation[] {
    const validations: RecipientValidation[] = [];

    const validateList = (emails: string[], type: 'to' | 'cc' | 'bcc') => {
      for (const email of emails) {
        const format = this.isValidEmailFormat(email);
        validations.push({
          email,
          valid: format,
          type,
          format,
          domainExists: format ? this.checkDomainFormat(email) : false,
        });
      }
    };

    validateList(request.to, 'to');
    if (request.cc) validateList(request.cc, 'cc');
    if (request.bcc) validateList(request.bcc, 'bcc');

    return validations;
  }

  /**
   * Assess risk level and score
   */
  private assessRisk(request: DraftRequest, validation: any, mime: MimePayload): RiskAssessment {
    const factors: RiskFactor[] = [];
    let score = 0;

    // Factor 1: Number of recipients
    const recipientCount = validation.recipientCount;
    if (recipientCount > 50) {
      factors.push({
        name: 'Large recipient list',
        score: 25,
        reason: `${recipientCount} recipients (high distribution)`,
      });
      score += 25;
    } else if (recipientCount > 10) {
      factors.push({
        name: 'Multiple recipients',
        score: 10,
        reason: `${recipientCount} recipients`,
      });
      score += 10;
    }

    // Factor 2: BCC usage
    if (request.bcc && request.bcc.length > 0) {
      factors.push({
        name: 'BCC recipients',
        score: 20,
        reason: 'Hidden recipients included',
      });
      score += 20;
    }

    // Factor 3: Attachment presence and size
    if (request.attachments && request.attachments.length > 0) {
      const totalSize = request.attachments.reduce((sum, att) => sum + att.size, 0);
      if (totalSize > 10 * 1024 * 1024) {
        factors.push({
          name: 'Large attachments',
          score: 15,
          reason: `${this.formatBytes(totalSize)} total`,
        });
        score += 15;
      }

      if (request.attachments.length > 3) {
        factors.push({
          name: 'Multiple attachments',
          score: 10,
          reason: `${request.attachments.length} files`,
        });
        score += 10;
      }
    }

    // Factor 4: HTML content
    if (request.html && request.html.length > 10000) {
      factors.push({
        name: 'Large HTML content',
        score: 5,
        reason: `${request.html.length} characters`,
      });
      score += 5;
    }

    // Factor 5: Validation issues
    const errorCount = validation.issues.filter((i: any) => i.severity === 'error').length;
    const warningCount = validation.issues.filter((i: any) => i.severity === 'warning').length;

    if (errorCount > 0) {
      factors.push({
        name: 'Validation errors',
        score: 75,
        reason: `${errorCount} error(s) found - draft cannot be sent`,
      });
      score += 75;
    } else if (warningCount > 2) {
      factors.push({
        name: 'Multiple warnings',
        score: 10,
        reason: `${warningCount} warning(s)`,
      });
      score += 10;
    }

    // Factor 6: Forbidden content
    const forbiddenIssues = validation.issues.filter((i: any) => i.field === 'content');
    if (forbiddenIssues.length > 0) {
      factors.push({
        name: 'Sensitive content',
        score: 25,
        reason: 'Potentially sensitive keywords found',
      });
      score += 25;
    }

    // Clamp score to 0-100
    score = Math.min(100, Math.max(0, score));

    // Determine risk level
    let riskLevel: RiskLevel;
    if (score >= 75) {
      riskLevel = 'critical';
    } else if (score >= 50) {
      riskLevel = 'high';
    } else if (score >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      riskLevel,
      score,
      factors,
    };
  }

  /**
   * Estimate risk level from request
   */
  private estimateRiskLevel(request: DraftRequest): RiskLevel {
    const factors = [];

    if (request.bcc && request.bcc.length > 0) factors.push(30);
    if (request.to && request.to.length > 10) factors.push(20);
    if (request.attachments && request.attachments.length > 2) factors.push(15);
    if (request.html && request.html.length > 15000) factors.push(10);

    const totalRisk = factors.reduce((a, b) => a + b, 10);

    if (totalRisk >= 50) return 'high';
    if (totalRisk >= 25) return 'medium';
    return 'low';
  }

  /**
   * Validate email format
   */
  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if domain looks valid
   */
  private checkDomainFormat(email: string): boolean {
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const domain = parts[1];
    // Check for basic domain format
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Helper function to create composer
 */
export function createComposer(config?: Partial<ComposerConfig>): DraftComposer {
  return new DraftComposer(config);
}
