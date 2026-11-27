/**
 * Gmail Draft Types
 * Core data structures for draft composition, validation, and management
 */

export type DraftStatus = 'draft' | 'validated' | 'previewed' | 'approved' | 'queued' | 'sent' | 'failed';
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Draft composition request
 */
export interface DraftRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: DraftAttachment[];
  inReplyTo?: string;
  references?: string[];
  customHeaders?: Record<string, string>;
}

/**
 * Attachment metadata (no actual file data)
 */
export interface DraftAttachment {
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  isInline?: boolean;
}

/**
 * Validation error/warning
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Validation report for draft
 */
export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
  estimatedSize: number;
  attachmentCount: number;
  recipientCount: number;
  confidence: number;
}

/**
 * MIME payload structure
 */
export interface MimePayload {
  mimeString: string;
  mimeBase64?: string;
  headers: Record<string, string>;
  bodyPreview: string;
  structure: MimeStructure;
}

/**
 * MIME message structure for debugging
 */
export interface MimeStructure {
  type: 'text/plain' | 'text/html' | 'multipart/mixed' | 'multipart/alternative' | 'multipart/related';
  charset?: string;
  parts?: MimeStructure[];
  size: number;
}

/**
 * Draft preview for human approval
 */
export interface DraftPreview {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyPreview: string;
  htmlPreview?: string;
  attachments: DraftAttachment[];
  estimatedSize: number;
  riskLevel: RiskLevel;
  warnings: ValidationIssue[];
  safetyChecks: SafetyCheck[];
  recipientValidation: RecipientValidation[];
}

/**
 * Safety check result
 */
export interface SafetyCheck {
  name: string;
  passed: boolean;
  message?: string;
}

/**
 * Recipient validation result
 */
export interface RecipientValidation {
  email: string;
  valid: boolean;
  type: 'to' | 'cc' | 'bcc';
  format: boolean;
  domainExists: boolean;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  riskLevel: RiskLevel;
  score: number; // 0-100
  factors: RiskFactor[];
}

/**
 * Individual risk factor
 */
export interface RiskFactor {
  name: string;
  score: number;
  reason: string;
}

/**
 * Draft composition result
 */
export interface DraftComposition {
  id: string;
  status: DraftStatus;
  request: DraftRequest;
  validation: ValidationReport;
  mime: MimePayload;
  preview: DraftPreview;
  riskAssessment: RiskAssessment;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

/**
 * Draft for storage/display
 */
export interface GmailDraft {
  id: string;
  gmailDraftId?: string;
  userId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: DraftAttachment[];
  status: DraftStatus;
  validation: ValidationReport;
  riskLevel: RiskLevel;
  mimeSize: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  queuedAt?: Date;
  sentAt?: Date;
  failureReason?: string;
  metadata: Record<string, any>;
}

/**
 * Draft queue task
 */
export interface DraftQueueTask {
  id: string;
  draftId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  action: 'create_draft' | 'send_email' | 'discard_draft';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  retries: number;
  maxRetries: number;
}

/**
 * Audit event for draft operations
 */
export interface DraftAuditEvent {
  id: string;
  draftId: string;
  userId: string;
  operator: string;
  action: 'draft_created' | 'draft_validated' | 'draft_previewed' | 'draft_approved' | 'draft_queued' | 'draft_sent' | 'draft_deleted';
  timestamp: Date;
  input?: any;
  output?: any;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata: Record<string, any>;
}

/**
 * Composer configuration
 */
export interface ComposerConfig {
  maxRecipients: number;
  maxSubjectLength: number;
  maxBodyLength: number;
  maxAttachmentSize: number;
  maxTotalAttachmentSize: number;
  maxAttachmentCount: number;
  allowedMimeTypes: string[];
  forbiddenWords: string[];
  requireHtmlAlternative: boolean;
  requireTextAlternative: boolean;
  validateRecipientsDomain: boolean;
  requireApproval: boolean;
}

/**
 * Default composer configuration
 */
export const DEFAULT_COMPOSER_CONFIG: ComposerConfig = {
  maxRecipients: 100,
  maxSubjectLength: 998,
  maxBodyLength: 102400,
  maxAttachmentSize: 25 * 1024 * 1024, // 25 MB
  maxTotalAttachmentSize: 100 * 1024 * 1024, // 100 MB
  maxAttachmentCount: 5,
  allowedMimeTypes: [
    'text/plain',
    'text/html',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  forbiddenWords: ['confidential', 'secret', 'internal only'],
  requireHtmlAlternative: true,
  requireTextAlternative: true,
  validateRecipientsDomain: true,
  requireApproval: true,
};
