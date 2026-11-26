/**
 * Tests for Gmail Draft Composer (Build 133)
 * Covers MIME generation, validation, composition, previews, risk assessment
 */

import { describe, it, expect } from 'vitest';
import { MimeBuilder } from '../../lib/connectors/gmail/mime-builder';
import { DraftValidator } from '../../lib/connectors/gmail/validator';
import { DraftComposer } from '../../lib/connectors/gmail/draft-composer';
import {
  DraftRequest,
  DEFAULT_COMPOSER_CONFIG,
} from '../../src/lib/gmail-drafts/types';
import {
  MOCK_DRAFT_REQUESTS,
  MOCK_VALIDATION_REPORTS,
  MOCK_MIME_PAYLOADS,
  MOCK_DRAFT_PREVIEWS,
  MOCK_RISK_ASSESSMENTS,
} from '../../src/lib/gmail-drafts/mock-data';

// ============================================================================
// MIME Builder Tests (8)
// ============================================================================

describe('MIME Builder', () => {
  const builder = new MimeBuilder();
  const senderEmail = 'sender@example.com';

  it('should build MIME for plain text email', () => {
    const mime = builder.buildMime(MOCK_DRAFT_REQUESTS.simple, senderEmail);

    expect(mime).toBeDefined();
    expect(mime.mimeString).toBeDefined();
    expect(mime.mimeBase64).toBeDefined();
    expect(mime.headers).toBeDefined();
    expect(mime.bodyPreview).toContain('simple');
    expect(mime.structure.type).toBe('text/plain');
  });

  it('should build MIME for HTML email', () => {
    const mime = builder.buildMime(MOCK_DRAFT_REQUESTS.withHtml, senderEmail);

    expect(mime.headers['Content-Type']).toContain('multipart/alternative');
    expect(mime.structure.type).toBe('multipart/alternative');
    expect(mime.structure.parts).toHaveLength(2);
  });

  it('should include all recipients in headers', () => {
    const mime = builder.buildMime(MOCK_DRAFT_REQUESTS.multiRecipient, senderEmail);

    expect(mime.headers['To']).toContain('user1@example.com');
    expect(mime.headers['Cc']).toBeDefined();
    expect(mime.headers['Bcc']).toBeDefined();
  });

  it('should handle attachments metadata', () => {
    const mime = builder.buildMime(MOCK_DRAFT_REQUESTS.withAttachments, senderEmail);

    expect(mime.headers['Content-Type']).toContain('multipart/mixed');
    expect(mime.structure.type).toBe('multipart/mixed');
    expect(mime.structure.parts).toBeDefined();
  });

  it('should encode UTF-8 subject correctly', () => {
    const request = { ...MOCK_DRAFT_REQUESTS.simple, subject: 'Hello 世界' };
    const mime = builder.buildMime(request, senderEmail);

    expect(mime.headers['Subject']).toBeDefined();
    // Should be base64 encoded or contain UTF-8 marker
    expect(mime.headers['Subject']).toMatch(/UTF-8|=\?/);
  });

  it('should calculate payload size', () => {
    const mime = builder.buildMime(MOCK_DRAFT_REQUESTS.simple, senderEmail);
    const size = builder.calculateSize ? builder.calculateSize(mime) : 0;

    expect(size).toBeGreaterThan(0);
  });

  it('should handle multipart MIME with base64 encoding', () => {
    const mime = builder.buildMime(MOCK_DRAFT_REQUESTS.withHtml, senderEmail);

    expect(mime.mimeBase64).toBeDefined();
    expect(mime.mimeBase64?.length).toBeGreaterThan(0);
    // Should be valid base64
    const decoded = Buffer.from(mime.mimeBase64 || '', 'base64').toString('utf-8');
    expect(decoded).toContain('From:');
  });

  it('should preserve custom headers', () => {
    const request = {
      ...MOCK_DRAFT_REQUESTS.simple,
      customHeaders: { 'X-Custom': 'CustomValue' },
    };
    const mime = builder.buildMime(request, senderEmail);

    expect(mime.headers['X-Custom']).toBe('CustomValue');
  });
});

// ============================================================================
// Draft Validator Tests (12)
// ============================================================================

describe('Draft Validator', () => {
  const validator = new DraftValidator();

  it('should validate simple valid draft', () => {
    const validation = validator.validate(MOCK_DRAFT_REQUESTS.simple);

    expect(validation.valid).toBe(true);
    expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });

  it('should reject invalid email addresses', () => {
    const validation = validator.validate(MOCK_DRAFT_REQUESTS.invalidRecipient);

    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.field === 'to')).toBe(true);
  });

  it('should require at least one recipient', () => {
    const request = { ...MOCK_DRAFT_REQUESTS.simple, to: [] };
    const validation = validator.validate(request);

    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.message.includes('At least one'))).toBe(true);
  });

  it('should validate subject length', () => {
    const request = { ...MOCK_DRAFT_REQUESTS.simple, subject: 'A'.repeat(1000) };
    const validation = validator.validate(request);

    expect(validation.issues.some(i => i.field === 'subject')).toBe(true);
  });

  it('should require subject', () => {
    const request = { ...MOCK_DRAFT_REQUESTS.simple, subject: '' };
    const validation = validator.validate(request);

    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.field === 'subject')).toBe(true);
  });

  it('should require body content', () => {
    const request = { ...MOCK_DRAFT_REQUESTS.simple, text: undefined, html: undefined };
    const validation = validator.validate(request);

    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.field === 'body')).toBe(true);
  });

  it('should validate email body length', () => {
    const request = { ...MOCK_DRAFT_REQUESTS.simple, text: 'A'.repeat(110000) };
    const validation = validator.validate(request);

    expect(validation.issues.some(i => i.field === 'body')).toBe(true);
  });

  it('should warn about BCC usage', () => {
    const validation = validator.validate(MOCK_DRAFT_REQUESTS.multiRecipient);

    expect(validation.issues.some(i => i.field === 'bcc')).toBe(true);
  });

  it('should validate attachment MIME types', () => {
    const request = {
      ...MOCK_DRAFT_REQUESTS.simple,
      attachments: [
        { filename: 'malware.exe', mimeType: 'application/x-executable', size: 1024 },
      ],
    };
    const validation = validator.validate(request);

    expect(validation.issues.some(i => i.field === 'attachments')).toBe(true);
  });

  it('should validate attachment size limits', () => {
    const request = {
      ...MOCK_DRAFT_REQUESTS.simple,
      attachments: [
        { filename: 'huge.zip', mimeType: 'application/zip', size: 30 * 1024 * 1024 },
      ],
    };
    const validation = validator.validate(request);

    expect(validation.issues.some(i => i.field === 'attachments')).toBe(true);
  });

  it('should detect forbidden words', () => {
    const validation = validator.validate(MOCK_DRAFT_REQUESTS.withForbiddenWord);

    expect(validation.issues.some(i => i.field === 'content')).toBe(true);
  });

  it('should calculate recipient and attachment counts', () => {
    const validation = validator.validate(MOCK_DRAFT_REQUESTS.multiRecipient);

    expect(validation.recipientCount).toBeGreaterThan(0);
    expect(validation.attachmentCount).toBe(0);
  });
});

// ============================================================================
// Draft Composer Tests (15)
// ============================================================================

describe('Draft Composer', () => {
  const composer = new DraftComposer();

  it('should compose simple draft', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft).toBeDefined();
    expect(draft.id).toBeDefined();
    expect(draft.status).toBe('draft');
    expect(draft.request).toBeDefined();
    expect(draft.validation).toBeDefined();
    expect(draft.mime).toBeDefined();
    expect(draft.preview).toBeDefined();
    expect(draft.riskAssessment).toBeDefined();
  });

  it('should generate draft preview', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft.preview).toBeDefined();
    expect(draft.preview.id).toBeDefined();
    expect(draft.preview.to).toBeDefined();
    expect(draft.preview.subject).toBeDefined();
    expect(draft.preview.bodyPreview).toBeDefined();
    expect(draft.preview.riskLevel).toBeDefined();
    expect(draft.preview.safetyChecks).toBeDefined();
  });

  it('should create safety checks', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft.preview.safetyChecks.length).toBeGreaterThan(0);
    expect(draft.preview.safetyChecks[0].name).toBeDefined();
    expect(draft.preview.safetyChecks[0].passed).toBeDefined();
  });

  it('should validate all recipients', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.multiRecipient, 'sender@example.com');

    expect(draft.preview.recipientValidation.length).toBeGreaterThan(0);
    draft.preview.recipientValidation.forEach(rv => {
      expect(rv.email).toBeDefined();
      expect(rv.valid).toBeDefined();
      expect(rv.type).toMatch(/to|cc|bcc/);
    });
  });

  it('should assess risk level correctly', async () => {
    const simpleDraft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');
    const complexDraft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.multiRecipient, 'sender@example.com');

    expect(simpleDraft.riskAssessment.riskLevel).toBe('low');
    expect(complexDraft.riskAssessment.riskLevel).toMatch(/low|medium|high/);
    expect(complexDraft.riskAssessment.score).toBeGreaterThanOrEqual(simpleDraft.riskAssessment.score);
  });

  it('should include risk factors', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.multiRecipient, 'sender@example.com');

    expect(draft.riskAssessment.factors).toBeDefined();
    expect(Array.isArray(draft.riskAssessment.factors)).toBe(true);
    if (draft.riskAssessment.factors.length > 0) {
      expect(draft.riskAssessment.factors[0].name).toBeDefined();
      expect(draft.riskAssessment.factors[0].score).toBeGreaterThan(0);
    }
  });

  it('should handle custom composer config', async () => {
    const customConfig = { maxSubjectLength: 50 };
    const customComposer = new DraftComposer(customConfig);
    const longSubjectRequest = { ...MOCK_DRAFT_REQUESTS.simple, subject: 'A'.repeat(100) };

    const draft = await customComposer.composeDraft(longSubjectRequest, 'sender@example.com');

    expect(draft.validation.issues.some(i => i.field === 'subject')).toBe(true);
  });

  it('should include validation in draft', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft.validation).toBeDefined();
    expect(draft.validation.valid).toBeDefined();
    expect(draft.validation.issues).toBeDefined();
    expect(draft.validation.estimatedSize).toBeGreaterThan(0);
  });

  it('should include MIME in draft', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft.mime).toBeDefined();
    expect(draft.mime.mimeString).toBeDefined();
    expect(draft.mime.headers).toBeDefined();
    expect(draft.mime.bodyPreview).toBeDefined();
    expect(draft.mime.structure).toBeDefined();
  });

  it('should create body preview from HTML', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.withHtml, 'sender@example.com');

    expect(draft.preview.bodyPreview).toBeDefined();
    expect(draft.preview.htmlPreview).toBeDefined();
    // HTML preview should have script/iframe removed
    expect(draft.preview.htmlPreview).not.toMatch(/<script/i);
  });

  it('should list attachments in preview', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.withAttachments, 'sender@example.com');

    expect(draft.preview.attachments).toBeDefined();
    expect(draft.preview.attachments.length).toBeGreaterThan(0);
    expect(draft.preview.attachments[0].filename).toBeDefined();
  });

  it('should estimate total email size', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft.preview.estimatedSize).toBeGreaterThan(0);
    expect(draft.validation.estimatedSize).toBeGreaterThan(0);
  });

  it('should flag invalid drafts in preview', async () => {
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.invalidRecipient, 'sender@example.com');

    expect(draft.validation.valid).toBe(false);
    expect(draft.preview.warnings.length).toBeGreaterThan(0);
  });

  it('should generate unique draft IDs', async () => {
    const draft1 = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');
    const draft2 = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    expect(draft1.id).not.toBe(draft2.id);
  });
});

// ============================================================================
// Integration Tests (5)
// ============================================================================

describe('Draft Composition Integration', () => {
  it('should compose, validate, and preview in workflow', async () => {
    const composer = new DraftComposer();
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.simple, 'sender@example.com');

    // Should have all components
    expect(draft.validation.valid).toBe(true);
    expect(draft.mime.mimeString).toContain('From:');
    expect(draft.preview.to).toEqual(['recipient@example.com']);
    expect(draft.riskAssessment.score).toBeLessThan(50);
  });

  it('should catch invalid email and prevent preview', async () => {
    const composer = new DraftComposer();
    const draft = await composer.composeDraft(MOCK_DRAFT_REQUESTS.invalidRecipient, 'sender@example.com');

    expect(draft.validation.valid).toBe(false);
    expect(draft.preview.warnings.length).toBeGreaterThan(0);
    expect(draft.riskAssessment.riskLevel).toBe('critical');
  });

  it('should handle large multi-recipient drafts', async () => {
    const composer = new DraftComposer();
    const largeRequest = {
      ...MOCK_DRAFT_REQUESTS.multiRecipient,
      to: Array.from({ length: 20 }, (_, i) => `user${i}@example.com`),
    };

    const draft = await composer.composeDraft(largeRequest, 'sender@example.com');

    expect(draft.preview.recipientValidation.length).toBeGreaterThan(20);
    expect(draft.riskAssessment.score).toBeGreaterThan(20);
  });

  it('should build valid MIME for all request types', async () => {
    const composer = new DraftComposer();

    for (const [name, request] of Object.entries(MOCK_DRAFT_REQUESTS)) {
      if (name === 'invalidRecipient') continue; // Skip invalid for this test

      const draft = await composer.composeDraft(request, 'sender@example.com');
      expect(draft.mime.mimeString).toContain('From:');
      expect(draft.mime.mimeString).toContain('To:');
    }
  });

  it('should produce deterministic drafts for same input', async () => {
    const composer = new DraftComposer();
    const request = MOCK_DRAFT_REQUESTS.simple;

    const draft1 = await composer.composeDraft(request, 'sender@example.com', 'fixed_id');
    const draft2 = await composer.composeDraft(request, 'sender@example.com', 'fixed_id');

    expect(draft1.id).toBe(draft2.id);
    expect(draft1.validation.valid).toBe(draft2.validation.valid);
    expect(draft1.riskAssessment.score).toBe(draft2.riskAssessment.score);
  });
});

// ============================================================================
// Edge Cases & Validation (5)
// ============================================================================

describe('Draft Composer Edge Cases', () => {
  it('should handle extremely long subject', async () => {
    const composer = new DraftComposer();
    const request = { ...MOCK_DRAFT_REQUESTS.simple, subject: 'S'.repeat(1500) };

    const draft = await composer.composeDraft(request, 'sender@example.com');

    expect(draft.validation.issues.some(i => i.field === 'subject')).toBe(true);
  });

  it('should handle unicode content', async () => {
    const composer = new DraftComposer();
    const request = {
      ...MOCK_DRAFT_REQUESTS.simple,
      subject: 'Hello 世界 🌍',
      text: 'Привет мир مرحبا',
    };

    const draft = await composer.composeDraft(request, 'sender@example.com');

    expect(draft.mime.mimeString).toBeDefined();
    expect(draft.validation.valid).toBe(true);
  });

  it('should handle empty CC/BCC', async () => {
    const composer = new DraftComposer();
    const request = { ...MOCK_DRAFT_REQUESTS.simple, cc: [], bcc: [] };

    const draft = await composer.composeDraft(request, 'sender@example.com');

    expect(draft.validation.valid).toBe(true);
  });

  it('should reject malformed email addresses', async () => {
    const composer = new DraftComposer();
    const invalidEmails = [
      'missing@domain',
      '@nodomain.com',
      'space in@email.com',
      'double@@domain.com',
    ];

    for (const email of invalidEmails) {
      const request = { ...MOCK_DRAFT_REQUESTS.simple, to: [email] };
      const draft = await composer.composeDraft(request, 'sender@example.com');
      expect(draft.validation.valid).toBe(false);
    }
  });

  it('should handle null/undefined optional fields', async () => {
    const composer = new DraftComposer();
    const request: any = {
      to: ['recipient@example.com'],
      subject: 'Test',
      text: 'Test',
      cc: undefined,
      bcc: null,
      attachments: undefined,
    };

    const draft = await composer.composeDraft(request, 'sender@example.com');

    expect(draft.validation.valid).toBe(true);
  });
});
