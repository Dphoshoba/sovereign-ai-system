/**
 * Gmail API Mock Data
 * Deterministic test data for Gmail Draft API integration
 * All timestamps relative to BASE_TIME = 2026-07-01T10:00:00Z
 */

import {
  GmailDraft,
  GmailMessage,
  GmailDraftList,
  OAuthToken,
  DraftReceipt,
  GmailDraftMetrics,
  OAuthRefreshMetrics,
  DraftAuditEvent,
} from './types';

// ============================================================================
// Base Time (Fixed for Determinism)
// ============================================================================

export const BASE_TIME = new Date('2026-07-01T10:00:00Z');

// Helper to create relative timestamps
function relativeTime(offsetMs: number): Date {
  return new Date(BASE_TIME.getTime() + offsetMs);
}

// ============================================================================
// Mock Gmail Drafts
// ============================================================================

export const MOCK_GMAIL_DRAFT_1: GmailDraft = {
  id: 'draft_msg_001',
  threadId: 'thread_001',
  message: {
    id: 'msg_001',
    threadId: 'thread_001',
    labelIds: ['DRAFT'],
    snippet: 'This is the first draft message...',
    sizeEstimate: 1024,
    historyId: 'hist_001',
    internalDate: relativeTime(0).getTime().toString(),
    payload: {
      mimeType: 'text/plain',
      headers: [
        { name: 'From', value: 'sender@example.com' },
        { name: 'To', value: 'recipient@example.com' },
        { name: 'Subject', value: 'Test Draft 1' },
      ],
      body: {
        size: 256,
        data: Buffer.from('This is the draft body content').toString('base64'),
      },
    },
  },
};

export const MOCK_GMAIL_DRAFT_2: GmailDraft = {
  id: 'draft_msg_002',
  threadId: 'thread_002',
  message: {
    id: 'msg_002',
    threadId: 'thread_002',
    labelIds: ['DRAFT'],
    snippet: 'Second draft message for testing...',
    sizeEstimate: 2048,
    historyId: 'hist_002',
    internalDate: relativeTime(3600000).getTime().toString(), // +1 hour
    payload: {
      mimeType: 'text/html',
      headers: [
        { name: 'From', value: 'sender@example.com' },
        { name: 'To', value: 'multiple@example.com' },
        { name: 'Cc', value: 'cc@example.com' },
        { name: 'Subject', value: 'Test Draft 2 with CC' },
      ],
      body: {
        size: 512,
        data: Buffer.from(
          '<html><body>This is HTML draft content</body></html>',
        ).toString('base64'),
      },
    },
  },
};

export const MOCK_GMAIL_DRAFT_LIST: GmailDraftList = {
  drafts: [MOCK_GMAIL_DRAFT_1, MOCK_GMAIL_DRAFT_2],
  resultSizeEstimate: 2,
};

// ============================================================================
// Mock OAuth Tokens
// ============================================================================

export const MOCK_OAUTH_TOKEN_VALID: OAuthToken = {
  accessToken: 'ya29_valid_token_abc123xyz',
  tokenType: 'Bearer',
  expiresIn: 3600,
  expiresAt: relativeTime(3600000), // +1 hour (valid)
  refreshToken: 'refresh_token_abc123',
  scope: ['https://www.googleapis.com/auth/gmail.modify'],
  accountId: 'account_001',
};

export const MOCK_OAUTH_TOKEN_EXPIRED: OAuthToken = {
  accessToken: 'ya29_expired_token_xyz789',
  tokenType: 'Bearer',
  expiresIn: 3600,
  expiresAt: relativeTime(-3600000), // -1 hour (expired)
  refreshToken: 'refresh_token_xyz789',
  scope: ['https://www.googleapis.com/auth/gmail.modify'],
  accountId: 'account_002',
};

export const MOCK_OAUTH_TOKEN_EXPIRING_SOON: OAuthToken = {
  accessToken: 'ya29_expiring_soon_def456',
  tokenType: 'Bearer',
  expiresIn: 3600,
  expiresAt: relativeTime(300000), // +5 min (expiring soon)
  refreshToken: 'refresh_token_def456',
  scope: ['https://www.googleapis.com/auth/gmail.modify'],
  accountId: 'account_003',
};

// ============================================================================
// Mock Draft Receipts
// ============================================================================

export const MOCK_DRAFT_RECEIPT_REAL_MODE: DraftReceipt = {
  id: 'receipt_001',
  executionId: 'exec_001',
  draftId: 'draft_001',
  gmailDraftId: 'draft_msg_001',
  threadId: 'thread_001',
  gmailAccount: 'user@example.com',
  createdTime: relativeTime(0),
  size: 1024,
  preview: 'This is the draft body content that was sent to Gmail...',
  mode: 'real',
  auditId: 'audit_001',
  status: 'created',
};

export const MOCK_DRAFT_RECEIPT_SIMULATION_MODE: DraftReceipt = {
  id: 'receipt_002',
  executionId: 'exec_002',
  draftId: 'draft_002',
  gmailDraftId: undefined, // Not set in simulation mode
  gmailAccount: 'user@example.com',
  createdTime: relativeTime(3600000),
  size: 512,
  preview: 'Simulated draft message preview text here...',
  mode: 'simulation',
  auditId: 'audit_002',
  status: 'created',
};

export const MOCK_DRAFT_RECEIPT_FAILED: DraftReceipt = {
  id: 'receipt_003',
  executionId: 'exec_003',
  draftId: 'draft_003',
  gmailAccount: 'user@example.com',
  createdTime: relativeTime(7200000),
  size: 0,
  preview: '',
  mode: 'real',
  auditId: 'audit_003',
  status: 'failed',
  error: 'Gmail API returned 403 Forbidden: Invalid credentials',
};

// ============================================================================
// Mock Audit Events
// ============================================================================

export const MOCK_DRAFT_AUDIT_EVENTS: DraftAuditEvent[] = [
  {
    id: 'audit_evt_001',
    type: 'gmail_draft_create_started',
    executionId: 'exec_001',
    draftReceiptId: 'receipt_001',
    operator: 'executor@example.com',
    timestamp: relativeTime(0),
    details: {
      to: ['recipient@example.com'],
      subject: 'Test Draft 1',
    },
    readonly: true,
  },
  {
    id: 'audit_evt_002',
    type: 'gmail_draft_created',
    executionId: 'exec_001',
    draftReceiptId: 'receipt_001',
    operator: 'executor@example.com',
    timestamp: relativeTime(500),
    details: {
      gmailDraftId: 'draft_msg_001',
      latencyMs: 500,
    },
    readonly: true,
  },
  {
    id: 'audit_evt_003',
    type: 'gmail_token_refreshed',
    executionId: 'exec_002',
    draftReceiptId: 'receipt_002',
    operator: 'system',
    timestamp: relativeTime(100),
    details: {
      accountId: 'account_003',
      expiresIn: 3600,
    },
    readonly: true,
  },
  {
    id: 'audit_evt_004',
    type: 'gmail_draft_simulated',
    executionId: 'exec_002',
    draftReceiptId: 'receipt_002',
    operator: 'executor@example.com',
    timestamp: relativeTime(3600000),
    details: {
      simulatedDraftId: 'msg_sim_1720099200000_a7b2f9c1',
      to: ['recipient@example.com'],
    },
    readonly: true,
  },
];

// ============================================================================
// Mock Metrics
// ============================================================================

export const MOCK_GMAIL_DRAFT_METRICS: GmailDraftMetrics = {
  totalDrafts: 42,
  successCount: 39,
  failureCount: 3,
  simulationCount: 18,
  realExecutionCount: 24,
  oauthRefreshCount: 5,
  averageLatencyMs: 850,
  lastRefreshTime: relativeTime(-1800000), // 30 min ago
  healthScore: 92,
  status: 'healthy',
};

export const MOCK_OAUTH_REFRESH_METRICS: OAuthRefreshMetrics = {
  totalRefreshes: 12,
  successCount: 11,
  failureCount: 1,
  averageLatencyMs: 320,
  lastRefreshTime: relativeTime(-900000), // 15 min ago
  nextRefreshTime: relativeTime(2700000), // 45 min from now
  healthScore: 91,
};

// ============================================================================
// Mock State Collections
// ============================================================================

export const MOCK_DRAFT_RECEIPTS_BY_STATUS = {
  created: [MOCK_DRAFT_RECEIPT_REAL_MODE, MOCK_DRAFT_RECEIPT_SIMULATION_MODE],
  failed: [MOCK_DRAFT_RECEIPT_FAILED],
  pending: [],
  deleted: [],
};

export const MOCK_DRAFT_RECEIPTS_BY_MODE = {
  simulation: [MOCK_DRAFT_RECEIPT_SIMULATION_MODE],
  real: [MOCK_DRAFT_RECEIPT_REAL_MODE, MOCK_DRAFT_RECEIPT_FAILED],
};
