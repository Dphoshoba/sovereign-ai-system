/**
 * Draft Preview Types
 * Safe preview generation for human approval
 */

import { DraftComposition } from '../gmail-drafts/types';

// ============================================================================
// Core Preview Types
// ============================================================================

/**
 * Safe preview for draft review
 */
export interface DraftPreview {
  id: string;
  draftId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyPreview: string; // Plain text excerpt, max 500 chars
  htmlPreview?: string; // Sanitized HTML snippet
  attachmentSummary: AttachmentSummary;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  validationWarnings: ValidationWarning[];
  estimatedSize: number; // bytes
  auditSummary: AuditSummary;
  createdAt: Date;
  expiresAt: Date; // Auto-expire after 7 days
  status: 'active' | 'expired' | 'archived';
}

export interface AttachmentSummary {
  count: number;
  totalSize: number;
  types: string[]; // MIME types
  names: string[];
}

export interface ValidationWarning {
  severity: 'info' | 'warning' | 'error';
  message: string;
  field?: string;
  suggestion?: string;
}

export interface AuditSummary {
  composed: Date;
  previewGenerated: Date;
  composerEmail: string;
  draftVersion: number;
}

// ============================================================================
// Preview Generation Request
// ============================================================================

/**
 * Request to generate preview from draft
 */
export interface PreviewGenerationRequest {
  draft: DraftComposition;
  expirationDays?: number; // Default 7
  tags?: string[];
}

/**
 * Preview generation response
 */
export interface PreviewGenerationResponse {
  success: boolean;
  preview?: DraftPreview;
  error?: string;
}

// ============================================================================
// Preview Rendering
// ============================================================================

/**
 * Safe HTML rendering for preview
 */
export interface SafeHtmlRender {
  sanitized: string;
  scripts_removed: number;
  external_links_blocked: number;
  embedded_content_stripped: number;
}

/**
 * Body preview generation options
 */
export interface BodyPreviewOptions {
  maxLength?: number; // Default 500
  includeHtml?: boolean;
  sanitizeHtml?: boolean;
  stripMarkdown?: boolean;
}

// ============================================================================
// Approval Decision Types
// ============================================================================

/**
 * Approval workflow states
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes' | 'expired';

/**
 * Approval decision
 */
export interface ApprovalDecision {
  id: string;
  previewId: string;
  draftId: string;
  status: ApprovalStatus;
  operator: string; // Email/ID of approver
  timestamp: Date;
  reason?: string;
  comments?: string;
  metadata?: Record<string, any>;
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  previewId: string;
  draftId: string;
  operator: string;
  decision: 'approve' | 'reject' | 'needs_changes';
  reason?: string;
  comments?: string;
}

/**
 * Approval response
 */
export interface ApprovalResponse {
  success: boolean;
  decision?: ApprovalDecision;
  error?: string;
  message?: string;
}

// ============================================================================
// Preview Metrics
// ============================================================================

/**
 * Approval coverage metrics
 */
export interface ApprovalMetrics {
  totalPreviews: number;
  approvedCount: number;
  rejectedCount: number;
  needsChangesCount: number;
  expiredCount: number;
  averageApprovalTime: number; // seconds
  approvalRate: number; // percentage
  rejectionRate: number; // percentage
  averageRiskScore: number;
}

/**
 * Preview health metrics
 */
export interface PreviewHealthMetrics {
  active: number;
  expired: number;
  archived: number;
  totalSize: number; // bytes
  avgRiskScore: number;
  criticalCount: number;
  timestamp: Date;
}

// ============================================================================
// Preview Archive
// ============================================================================

/**
 * Archived preview record
 */
export interface ArchivedPreview {
  id: string;
  originalPreview: DraftPreview;
  approval: ApprovalDecision;
  archivedAt: Date;
  retentionDays: number; // Default 90
  deletesAt: Date;
}

// ============================================================================
// Default Configuration
// ============================================================================

export interface PreviewConfig {
  previewExpiration: number; // days
  maxBodyPreviewLength: number;
  htmlSanitizeOptions?: Record<string, any>;
  archiveRetention: number; // days
}

export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  previewExpiration: 7,
  maxBodyPreviewLength: 500,
  archiveRetention: 90,
};
