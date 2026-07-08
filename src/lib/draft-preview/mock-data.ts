/**
 * Draft Preview Mock Data
 * Deterministic test data for preview workflow
 */

import {
  DraftPreview,
  AttachmentSummary,
  ValidationWarning,
  AuditSummary,
  ApprovalDecision,
  ApprovalMetrics,
  PreviewHealthMetrics,
} from './types';
import { MOCK_DRAFT_REQUESTS, MOCK_GMAIL_DRAFTS } from '../gmail-drafts/mock-data';

// ============================================================================
// Mock Attachment Summaries
// ============================================================================

export const MOCK_ATTACHMENT_SUMMARY = {
  empty: {
    count: 0,
    totalSize: 0,
    types: [],
    names: [],
  } as AttachmentSummary,

  single: {
    count: 1,
    totalSize: 1024 * 500,
    types: ['application/pdf'],
    names: ['document.pdf'],
  } as AttachmentSummary,

  multiple: {
    count: 3,
    totalSize: 1024 * 2500,
    types: ['application/pdf', 'image/png', 'application/vnd.ms-excel'],
    names: ['report.pdf', 'chart.png', 'data.xlsx'],
  } as AttachmentSummary,

  large: {
    count: 2,
    totalSize: 1024 * 1024 * 15,
    types: ['video/mp4', 'application/zip'],
    names: ['presentation.mp4', 'archive.zip'],
  } as AttachmentSummary,
};

// ============================================================================
// Mock Validation Warnings
// ============================================================================

export const MOCK_VALIDATION_WARNINGS = {
  none: [] as ValidationWarning[],

  mild: [
    {
      severity: 'info' as const,
      message: 'HTML content provided but no plain text alternative',
      field: 'body',
      suggestion: 'Consider providing plain text version',
    },
  ] as ValidationWarning[],

  moderate: [
    {
      severity: 'warning' as const,
      message: 'BCC recipients included - verify recipients are correct',
      field: 'bcc',
    },
    {
      severity: 'info' as const,
      message: 'Large HTML content detected',
      field: 'body',
    },
  ] as ValidationWarning[],

  severe: [
    {
      severity: 'error' as const,
      message: 'Invalid email address detected',
      field: 'cc',
      suggestion: 'Review email addresses: expected format user@domain.com',
    },
    {
      severity: 'warning' as const,
      message: 'Attachment exceeds recommended size',
      field: 'attachments',
    },
  ] as ValidationWarning[],
};

// ============================================================================
// Mock Audit Summaries
// ============================================================================

export const MOCK_AUDIT_SUMMARY = {
  standard: {
    composed: new Date('2026-07-08T10:00:00Z'),
    previewGenerated: new Date('2026-07-08T10:00:15Z'),
    composerEmail: 'composer@example.com',
    draftVersion: 1,
  } as AuditSummary,

  revised: {
    composed: new Date('2026-07-08T09:00:00Z'),
    previewGenerated: new Date('2026-07-08T10:30:00Z'),
    composerEmail: 'composer@example.com',
    draftVersion: 3,
  } as AuditSummary,
};

// ============================================================================
// Mock Previews
// ============================================================================

export const MOCK_DRAFT_PREVIEWS = {
  simple: {
    id: 'preview_001',
    draftId: 'draft_simple',
    to: ['recipient@example.com'],
    cc: [],
    bcc: [],
    subject: 'Simple Email',
    bodyPreview: 'This is a simple email body for testing purposes.',
    htmlPreview: undefined,
    attachmentSummary: MOCK_ATTACHMENT_SUMMARY.empty,
    riskScore: 5,
    riskLevel: 'low' as const,
    validationWarnings: MOCK_VALIDATION_WARNINGS.none,
    estimatedSize: 256,
    auditSummary: MOCK_AUDIT_SUMMARY.standard,
    createdAt: new Date('2026-07-08T10:00:15Z'),
    expiresAt: new Date('2026-07-15T10:00:15Z'),
    status: 'active' as const,
  } as DraftPreview,

  withAttachments: {
    id: 'preview_002',
    draftId: 'draft_withAttachments',
    to: ['recipient1@example.com', 'recipient2@example.com'],
    cc: ['cc@example.com'],
    bcc: [],
    subject: 'Email with Attachments',
    bodyPreview: 'Please find attached the requested documents and reports.',
    htmlPreview: '<p>Please find attached the requested documents and reports.</p>',
    attachmentSummary: MOCK_ATTACHMENT_SUMMARY.multiple,
    riskScore: 15,
    riskLevel: 'low' as const,
    validationWarnings: MOCK_VALIDATION_WARNINGS.mild,
    estimatedSize: 2560,
    auditSummary: MOCK_AUDIT_SUMMARY.standard,
    createdAt: new Date('2026-07-08T10:05:00Z'),
    expiresAt: new Date('2026-07-15T10:05:00Z'),
    status: 'active' as const,
  } as DraftPreview,

  highRisk: {
    id: 'preview_003',
    draftId: 'draft_highRisk',
    to: Array.from({ length: 50 }, (_, i) => `user${i}@example.com`),
    cc: ['cc1@example.com', 'cc2@example.com', 'cc3@example.com'],
    bcc: ['hidden@example.com'],
    subject: 'Broadcast: Important Announcement',
    bodyPreview: 'This is a large distribution email with sensitive content review required.',
    htmlPreview: '<p>This is a large distribution email with sensitive content review required.</p>',
    attachmentSummary: MOCK_ATTACHMENT_SUMMARY.large,
    riskScore: 72,
    riskLevel: 'high' as const,
    validationWarnings: MOCK_VALIDATION_WARNINGS.moderate,
    estimatedSize: 51200,
    auditSummary: MOCK_AUDIT_SUMMARY.standard,
    createdAt: new Date('2026-07-08T10:10:00Z'),
    expiresAt: new Date('2026-07-15T10:10:00Z'),
    status: 'active' as const,
  } as DraftPreview,

  critical: {
    id: 'preview_004',
    draftId: 'draft_critical',
    to: ['invalid-email'],
    cc: [],
    bcc: [],
    subject: '',
    bodyPreview: '',
    htmlPreview: undefined,
    attachmentSummary: MOCK_ATTACHMENT_SUMMARY.empty,
    riskScore: 95,
    riskLevel: 'critical' as const,
    validationWarnings: MOCK_VALIDATION_WARNINGS.severe,
    estimatedSize: 0,
    auditSummary: MOCK_AUDIT_SUMMARY.standard,
    createdAt: new Date('2026-07-08T10:15:00Z'),
    expiresAt: new Date('2026-07-15T10:15:00Z'),
    status: 'active' as const,
  } as DraftPreview,

  expired: {
    id: 'preview_005',
    draftId: 'draft_expired',
    to: ['recipient@example.com'],
    cc: [],
    bcc: [],
    subject: 'Expired Preview',
    bodyPreview: 'This preview has expired.',
    htmlPreview: undefined,
    attachmentSummary: MOCK_ATTACHMENT_SUMMARY.empty,
    riskScore: 10,
    riskLevel: 'low' as const,
    validationWarnings: MOCK_VALIDATION_WARNINGS.none,
    estimatedSize: 128,
    auditSummary: MOCK_AUDIT_SUMMARY.standard,
    createdAt: new Date('2026-06-30T10:00:00Z'),
    expiresAt: new Date('2026-07-07T10:00:00Z'),
    status: 'expired' as const,
  } as DraftPreview,
};

// ============================================================================
// Mock Approval Decisions
// ============================================================================

export const MOCK_APPROVAL_DECISIONS = {
  approved: {
    id: 'approval_001',
    previewId: 'preview_001',
    draftId: 'draft_simple',
    status: 'approved' as const,
    operator: 'approver@example.com',
    timestamp: new Date('2026-07-08T10:05:00Z'),
    reason: 'Content verified and appropriate for sending',
    comments: 'Ready for queue.',
  } as ApprovalDecision,

  rejected: {
    id: 'approval_002',
    previewId: 'preview_003',
    draftId: 'draft_highRisk',
    status: 'rejected' as const,
    operator: 'approver@example.com',
    timestamp: new Date('2026-07-08T10:12:00Z'),
    reason: 'Distribution list too large, requires management approval',
    comments: 'Please split into smaller groups or get executive approval.',
  } as ApprovalDecision,

  needsChanges: {
    id: 'approval_003',
    previewId: 'preview_004',
    draftId: 'draft_critical',
    status: 'needs_changes' as const,
    operator: 'approver@example.com',
    timestamp: new Date('2026-07-08T10:17:00Z'),
    reason: 'Validation errors must be corrected',
    comments: 'Invalid email address and missing subject line. Return for editing.',
  } as ApprovalDecision,

  pending: {
    id: 'approval_004',
    previewId: 'preview_002',
    draftId: 'draft_withAttachments',
    status: 'pending' as const,
    operator: '',
    timestamp: new Date('2026-07-08T10:06:00Z'),
  } as ApprovalDecision,
};

// ============================================================================
// Mock Metrics
// ============================================================================

export const MOCK_APPROVAL_METRICS = {
  healthy: {
    totalPreviews: 150,
    approvedCount: 120,
    rejectedCount: 15,
    needsChangesCount: 10,
    expiredCount: 5,
    averageApprovalTime: 180,
    approvalRate: 80,
    rejectionRate: 10,
    averageRiskScore: 25,
  } as ApprovalMetrics,

  degraded: {
    totalPreviews: 300,
    approvedCount: 180,
    rejectedCount: 80,
    needsChangesCount: 30,
    expiredCount: 10,
    averageApprovalTime: 900,
    approvalRate: 60,
    rejectionRate: 27,
    averageRiskScore: 45,
  } as ApprovalMetrics,
};

export const MOCK_PREVIEW_HEALTH_METRICS = {
  healthy: {
    active: 45,
    expired: 3,
    archived: 102,
    totalSize: 1024 * 1024 * 50,
    avgRiskScore: 22,
    criticalCount: 1,
    timestamp: new Date('2026-07-08T10:30:00Z'),
  } as PreviewHealthMetrics,

  stressed: {
    active: 250,
    expired: 40,
    archived: 500,
    totalSize: 1024 * 1024 * 500,
    avgRiskScore: 52,
    criticalCount: 12,
    timestamp: new Date('2026-07-08T10:30:00Z'),
  } as PreviewHealthMetrics,
};
