/**
 * Gmail API Type Definitions
 * Types for Draft API, OAuth, and draft receipts
 * Used by Build 136: Gmail Draft API Integration
 */

// ============================================================================
// Gmail API Draft Types
// ============================================================================

export interface GmailDraft {
  id: string;
  message: GmailMessage;
  threadId?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: GmailPayload;
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GmailPayload {
  mimeType: string;
  headers: GmailHeader[];
  body: GmailBody;
  parts?: GmailPayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailBody {
  size: number;
  data?: string; // base64 encoded
}

export interface GmailDraftList {
  drafts?: GmailDraft[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: Date;
  refreshToken?: string;
  scope: string[];
  accountId: string;
}

export interface OAuthRefreshRequest {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
}

export interface OAuthRefreshResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope: string;
  // refreshToken omitted if not provided by provider
}

export interface OAuthConnection {
  id: string;
  accountId: string;
  accountEmail: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
  createdAt: Date;
  updatedAt: Date;
  isValid(): boolean;
  isExpired(): boolean;
  needsRefresh(): boolean;
}

// ============================================================================
// Draft Receipt Types
// ============================================================================

export interface DraftReceipt {
  id: string;
  executionId: string;
  draftId: string;
  gmailDraftId?: string; // Only present in real mode
  threadId?: string;
  gmailAccount: string;
  createdTime: Date;
  size: number;
  preview: string; // First 100 chars of draft
  mode: 'simulation' | 'real';
  auditId: string;
  status: DraftReceiptStatus;
  error?: string;
}

export type DraftReceiptStatus = 'pending' | 'created' | 'failed' | 'deleted';

// ============================================================================
// Gmail API Error Types
// ============================================================================

export interface GmailApiError {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
    location?: string;
    locationType?: string;
  }>;
}

export class GmailApiException extends Error {
  constructor(
    public statusCode: number,
    public gmailError: GmailApiError,
  ) {
    super(gmailError.message);
    this.name = 'GmailApiException';
  }

  isRetriable(): boolean {
    const retriableCodes = [408, 429, 500, 502, 503, 504];
    return retriableCodes.includes(this.statusCode);
  }

  isPermanent(): boolean {
    const permanentCodes = [400, 401, 403, 404];
    return permanentCodes.includes(this.statusCode);
  }
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateDraftRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    mimeType: string;
  }>;
}

export interface CreateDraftResponse {
  success: boolean;
  receipt?: DraftReceipt;
  error?: string;
  gmailDraftId?: string;
}

export interface GetDraftResponse {
  success: boolean;
  receipt?: DraftReceipt;
  draft?: GmailDraft;
  error?: string;
}

export interface ListDraftsResponse {
  success: boolean;
  receipts: DraftReceipt[];
  totalCount: number;
  pageToken?: string;
}

export interface DeleteDraftResponse {
  success: boolean;
  gmailDraftId?: string;
  deleted: boolean;
  error?: string;
}

// ============================================================================
// Safety & Audit Types
// ============================================================================

export interface DraftAuditEvent {
  id: string;
  type: DraftAuditEventType;
  executionId: string;
  draftReceiptId: string;
  operator: string;
  timestamp: Date;
  details: Record<string, unknown>;
  readonly: true;
}

export type DraftAuditEventType =
  | 'gmail_draft_create_started'
  | 'gmail_draft_created'
  | 'gmail_draft_deleted'
  | 'gmail_token_refreshed'
  | 'gmail_api_failed'
  | 'gmail_draft_simulated';

// ============================================================================
// Metrics Types
// ============================================================================

export interface GmailDraftMetrics {
  totalDrafts: number;
  successCount: number;
  failureCount: number;
  simulationCount: number;
  realExecutionCount: number;
  oauthRefreshCount: number;
  averageLatencyMs: number;
  lastRefreshTime?: Date;
  healthScore: number; // 0-100
  status: 'healthy' | 'degraded' | 'critical';
}

// ============================================================================
// OAuth Refresh Types
// ============================================================================

export interface OAuthRefreshMetrics {
  totalRefreshes: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  lastRefreshTime?: Date;
  nextRefreshTime?: Date;
  healthScore: number; // 0-100
}
