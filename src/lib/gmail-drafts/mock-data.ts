/**
 * Mock Data for Gmail Drafts
 * Deterministic test data and utilities
 */

import {
  DraftRequest,
  DraftComposition,
  DraftPreview,
  ValidationReport,
  MimePayload,
  RiskAssessment,
  GmailDraft,
  DraftQueueTask,
  DraftAuditEvent,
} from './types';

/**
 * Sample draft requests for testing
 */
export const MOCK_DRAFT_REQUESTS: Record<string, DraftRequest> = {
  simple: {
    to: ['recipient@example.com'],
    subject: 'Hello World',
    text: 'This is a simple text message.',
  },

  withHtml: {
    to: ['recipient@example.com'],
    cc: ['cc@example.com'],
    subject: 'HTML Email',
    html: '<p>This is an HTML email with <strong>formatting</strong>.</p>',
    text: 'This is an HTML email with formatting.',
  },

  multiRecipient: {
    to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
    cc: ['manager@example.com'],
    bcc: ['audit@example.com'],
    subject: 'Team Update',
    html: '<p>Here is the team update for this week.</p>',
    text: 'Here is the team update for this week.',
  },

  withAttachments: {
    to: ['recipient@example.com'],
    subject: 'Document Review',
    html: '<p>Please review the attached document.</p>',
    text: 'Please review the attached document.',
    attachments: [
      {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 500,
        contentId: 'doc123',
      },
      {
        filename: 'image.jpg',
        mimeType: 'image/jpeg',
        size: 1024 * 100,
        contentId: 'img456',
        isInline: true,
      },
    ],
  },

  invalidRecipient: {
    to: ['not-an-email'],
    subject: 'Invalid',
    text: 'This will fail validation.',
  },

  longBody: {
    to: ['recipient@example.com'],
    subject: 'Long Email',
    text: 'A'.repeat(110000),
  },

  withForbiddenWord: {
    to: ['recipient@example.com'],
    subject: 'Confidential Information',
    text: 'This email contains confidential data.',
  },
};

/**
 * Sample validation reports
 */
export const MOCK_VALIDATION_REPORTS: Record<string, ValidationReport> = {
  valid: {
    valid: true,
    issues: [],
    estimatedSize: 2048,
    attachmentCount: 0,
    recipientCount: 1,
    confidence: 1.0,
  },

  withWarnings: {
    valid: true,
    issues: [
      {
        severity: 'warning',
        field: 'subject',
        message: 'Subject line is quite long',
        suggestion: 'Consider shortening for better readability on mobile devices',
      },
    ],
    estimatedSize: 5120,
    attachmentCount: 1,
    recipientCount: 3,
    confidence: 0.95,
  },

  invalid: {
    valid: false,
    issues: [
      {
        severity: 'error',
        field: 'to',
        message: 'Invalid email address: not-an-email',
      },
      {
        severity: 'error',
        field: 'subject',
        message: 'Subject is required',
      },
    ],
    estimatedSize: 0,
    attachmentCount: 0,
    recipientCount: 0,
    confidence: 0.0,
  },
};

/**
 * Sample MIME payloads
 */
export const MOCK_MIME_PAYLOADS: Record<string, MimePayload> = {
  simple: {
    mimeString: `From: sender@example.com
To: recipient@example.com
Subject: Hello World
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"

This is a simple text message.`,
    headers: {
      From: 'sender@example.com',
      To: 'recipient@example.com',
      Subject: 'Hello World',
      'MIME-Version': '1.0',
      'Content-Type': 'text/plain; charset="UTF-8"',
    },
    bodyPreview: 'This is a simple text message.',
    structure: {
      type: 'text/plain',
      charset: 'UTF-8',
      size: 150,
    },
  },

  multipart: {
    mimeString: `From: sender@example.com
To: recipient@example.com
Subject: HTML Email
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary123"

--boundary123
Content-Type: text/plain; charset="UTF-8"

Text version of email

--boundary123
Content-Type: text/html; charset="UTF-8"

<p>HTML version of email</p>

--boundary123--`,
    headers: {
      From: 'sender@example.com',
      To: 'recipient@example.com',
      Subject: 'HTML Email',
      'MIME-Version': '1.0',
      'Content-Type': 'multipart/alternative; boundary="boundary123"',
    },
    bodyPreview: 'HTML version of email',
    structure: {
      type: 'multipart/alternative',
      size: 350,
      parts: [
        { type: 'text/plain', charset: 'UTF-8', size: 100 },
        { type: 'text/html', charset: 'UTF-8', size: 100 },
      ],
    },
  },
};

/**
 * Sample risk assessments
 */
export const MOCK_RISK_ASSESSMENTS: Record<string, RiskAssessment> = {
  low: {
    riskLevel: 'low',
    score: 15,
    factors: [
      { name: 'Single recipient', score: 5, reason: 'Low risk for single recipient' },
      { name: 'No attachments', score: 10, reason: 'No attachments to validate' },
    ],
  },

  high: {
    riskLevel: 'high',
    score: 75,
    factors: [
      { name: 'Many recipients', score: 25, reason: 'Email to 10+ recipients' },
      { name: 'Large attachment', score: 30, reason: 'Attachment exceeds 10MB' },
      { name: 'Forbidden word detected', score: 20, reason: 'Contains "confidential"' },
    ],
  },

  critical: {
    riskLevel: 'critical',
    score: 95,
    factors: [
      { name: 'BCC recipients', score: 30, reason: 'Hidden recipients (BCC)' },
      { name: 'Multiple large attachments', score: 35, reason: 'Total attachment size > 50MB' },
      { name: 'Forbidden content', score: 30, reason: 'Contains restricted keywords' },
    ],
  },
};

/**
 * Sample draft previews
 */
export const MOCK_DRAFT_PREVIEWS: Record<string, DraftPreview> = {
  simple: {
    id: 'draft_001',
    to: ['recipient@example.com'],
    subject: 'Hello World',
    bodyPreview: 'This is a simple text message.',
    attachments: [],
    estimatedSize: 150,
    riskLevel: 'low',
    warnings: [],
    safetyChecks: [
      { name: 'Valid recipients', passed: true },
      { name: 'Subject not empty', passed: true },
      { name: 'No forbidden content', passed: true },
    ],
    recipientValidation: [
      {
        email: 'recipient@example.com',
        valid: true,
        type: 'to',
        format: true,
        domainExists: true,
      },
    ],
  },

  complex: {
    id: 'draft_002',
    to: ['user1@example.com', 'user2@example.com'],
    cc: ['manager@example.com'],
    bcc: ['audit@example.com'],
    subject: 'Team Update',
    bodyPreview: 'Here is the team update for this week...',
    htmlPreview: '<p>Here is the team update for this week...</p>',
    attachments: [
      { filename: 'report.pdf', mimeType: 'application/pdf', size: 512000 },
    ],
    estimatedSize: 520000,
    riskLevel: 'medium',
    warnings: [
      {
        severity: 'warning',
        field: 'attachments',
        message: 'Attachment size approaching Gmail limit',
      },
    ],
    safetyChecks: [
      { name: 'Valid recipients', passed: true },
      { name: 'Subject not empty', passed: true },
      { name: 'No forbidden content', passed: true },
      { name: 'Attachment size acceptable', passed: true, message: 'Under 25MB limit' },
    ],
    recipientValidation: [
      {
        email: 'user1@example.com',
        valid: true,
        type: 'to',
        format: true,
        domainExists: true,
      },
      {
        email: 'user2@example.com',
        valid: true,
        type: 'to',
        format: true,
        domainExists: true,
      },
      {
        email: 'manager@example.com',
        valid: true,
        type: 'cc',
        format: true,
        domainExists: true,
      },
      {
        email: 'audit@example.com',
        valid: true,
        type: 'bcc',
        format: true,
        domainExists: true,
      },
    ],
  },
};

/**
 * Sample Gmail drafts
 */
export const MOCK_GMAIL_DRAFTS: Record<string, GmailDraft> = {
  example1: {
    id: 'draft_001',
    gmailDraftId: 'gmail_123456',
    userId: 'user_001',
    to: ['recipient@example.com'],
    subject: 'Hello World',
    bodyText: 'This is a simple text message.',
    attachments: [],
    status: 'queued',
    validation: MOCK_VALIDATION_REPORTS.valid,
    riskLevel: 'low',
    mimeSize: 150,
    createdAt: new Date('2026-07-08T10:00:00Z'),
    updatedAt: new Date('2026-07-08T10:05:00Z'),
    approvedAt: new Date('2026-07-08T10:02:00Z'),
    approvedBy: 'user_001',
    queuedAt: new Date('2026-07-08T10:05:00Z'),
    metadata: {},
  },
};

/**
 * Sample queue tasks
 */
export const MOCK_QUEUE_TASKS: Record<string, DraftQueueTask> = {
  pending: {
    id: 'task_001',
    draftId: 'draft_001',
    userId: 'user_001',
    status: 'pending',
    action: 'create_draft',
    createdAt: new Date(),
    retries: 0,
    maxRetries: 3,
  },

  completed: {
    id: 'task_002',
    draftId: 'draft_002',
    userId: 'user_001',
    status: 'completed',
    action: 'create_draft',
    createdAt: new Date('2026-07-08T09:00:00Z'),
    startedAt: new Date('2026-07-08T09:05:00Z'),
    completedAt: new Date('2026-07-08T09:10:00Z'),
    result: { gmailDraftId: 'gmail_123456' },
    retries: 0,
    maxRetries: 3,
  },
};

/**
 * Sample audit events
 */
export const MOCK_AUDIT_EVENTS: DraftAuditEvent[] = [
  {
    id: 'audit_001',
    draftId: 'draft_001',
    userId: 'user_001',
    operator: 'user_001',
    action: 'draft_created',
    timestamp: new Date('2026-07-08T10:00:00Z'),
    status: 'success',
    metadata: {},
  },
  {
    id: 'audit_002',
    draftId: 'draft_001',
    userId: 'user_001',
    operator: 'user_001',
    action: 'draft_validated',
    timestamp: new Date('2026-07-08T10:01:00Z'),
    status: 'success',
    metadata: { confidence: 1.0 },
  },
  {
    id: 'audit_003',
    draftId: 'draft_001',
    userId: 'user_001',
    operator: 'user_001',
    action: 'draft_approved',
    timestamp: new Date('2026-07-08T10:02:00Z'),
    status: 'success',
    metadata: { riskLevel: 'low' },
  },
  {
    id: 'audit_004',
    draftId: 'draft_001',
    userId: 'user_001',
    operator: 'system',
    action: 'draft_queued',
    timestamp: new Date('2026-07-08T10:05:00Z'),
    status: 'success',
    metadata: { queueTaskId: 'task_001' },
  },
];
