/**
 * Approval Queue Mock Data
 * Deterministic test data for queue workflow
 */

import {
  QueuedDraft,
  QueueEntry,
  QueueEvent,
  QueueMetrics,
  QueueHealth,
  QueueStats,
  AuditEvent,
  ExecutionState,
} from './types';
import { MOCK_DRAFT_PREVIEWS, MOCK_APPROVAL_DECISIONS } from '../draft-preview/mock-data';

// ============================================================================
// Mock Queued Drafts
// ============================================================================

export const MOCK_QUEUED_DRAFTS = {
  waiting: {
    id: 'queued_001',
    draftId: 'draft_simple',
    previewId: 'preview_001',
    approvalId: 'approval_001',
    priority: 'normal' as const,
    executionState: 'waiting' as const,
    createdAt: new Date('2026-07-08T10:05:30Z'),
    scheduledTime: undefined,
    startedAt: undefined,
    completedAt: undefined,
    cancelledAt: undefined,
    retryCount: 0,
    maxRetries: 3,
  } as QueuedDraft,

  scheduled: {
    id: 'queued_002',
    draftId: 'draft_withAttachments',
    previewId: 'preview_002',
    approvalId: 'approval_003',
    priority: 'high' as const,
    executionState: 'scheduled' as const,
    createdAt: new Date('2026-07-08T10:06:30Z'),
    scheduledTime: new Date('2026-07-08T14:00:00Z'),
    startedAt: undefined,
    completedAt: undefined,
    cancelledAt: undefined,
    retryCount: 0,
    maxRetries: 3,
    estimatedExecutionTime: 5,
  } as QueuedDraft,

  running: {
    id: 'queued_003',
    draftId: 'draft_001',
    previewId: 'preview_001',
    approvalId: 'approval_001',
    priority: 'critical' as const,
    executionState: 'running' as const,
    createdAt: new Date('2026-07-08T09:00:00Z'),
    scheduledTime: new Date('2026-07-08T10:00:00Z'),
    startedAt: new Date('2026-07-08T10:00:30Z'),
    completedAt: undefined,
    cancelledAt: undefined,
    retryCount: 0,
    maxRetries: 3,
    estimatedExecutionTime: 10,
  } as QueuedDraft,

  completed: {
    id: 'queued_004',
    draftId: 'draft_002',
    previewId: 'preview_001',
    approvalId: 'approval_001',
    priority: 'normal' as const,
    executionState: 'completed' as const,
    createdAt: new Date('2026-07-08T08:00:00Z'),
    scheduledTime: new Date('2026-07-08T08:30:00Z'),
    startedAt: new Date('2026-07-08T08:30:15Z'),
    completedAt: new Date('2026-07-08T08:30:22Z'),
    cancelledAt: undefined,
    retryCount: 0,
    maxRetries: 3,
    estimatedExecutionTime: 7,
  } as QueuedDraft,

  failed: {
    id: 'queued_005',
    draftId: 'draft_003',
    previewId: 'preview_001',
    approvalId: 'approval_001',
    priority: 'normal' as const,
    executionState: 'failed' as const,
    createdAt: new Date('2026-07-08T07:00:00Z'),
    scheduledTime: new Date('2026-07-08T07:30:00Z'),
    startedAt: new Date('2026-07-08T07:30:10Z'),
    completedAt: new Date('2026-07-08T07:30:45Z'),
    cancelledAt: undefined,
    retryCount: 1,
    maxRetries: 3,
    lastError: 'Gmail API timeout after 30s',
    estimatedExecutionTime: 15,
  } as QueuedDraft,

  cancelled: {
    id: 'queued_006',
    draftId: 'draft_004',
    previewId: 'preview_001',
    approvalId: 'approval_001',
    priority: 'low' as const,
    executionState: 'cancelled' as const,
    createdAt: new Date('2026-07-07T20:00:00Z'),
    scheduledTime: new Date('2026-07-08T06:00:00Z'),
    startedAt: undefined,
    completedAt: undefined,
    cancelledAt: new Date('2026-07-08T05:45:00Z'),
    retryCount: 0,
    maxRetries: 3,
  } as QueuedDraft,
};

// ============================================================================
// Mock Queue Events
// ============================================================================

export const MOCK_QUEUE_EVENTS = {
  queued: {
    id: 'event_001',
    queuedDraftId: 'queued_001',
    draftId: 'draft_simple',
    eventType: 'queued' as const,
    timestamp: new Date('2026-07-08T10:05:30Z'),
    state: 'waiting' as const,
    operator: 'approver@example.com',
    message: 'Draft queued for execution',
  } as QueueEvent,

  started: {
    id: 'event_002',
    queuedDraftId: 'queued_003',
    draftId: 'draft_001',
    eventType: 'started' as const,
    timestamp: new Date('2026-07-08T10:00:30Z'),
    state: 'running' as const,
    message: 'Execution started',
  } as QueueEvent,

  completed: {
    id: 'event_003',
    queuedDraftId: 'queued_004',
    draftId: 'draft_002',
    eventType: 'completed' as const,
    timestamp: new Date('2026-07-08T08:30:22Z'),
    state: 'completed' as const,
    message: 'Successfully sent to 150 recipients',
    details: {
      recipientCount: 150,
      sentCount: 150,
      failedCount: 0,
    },
  } as QueueEvent,

  failed: {
    id: 'event_004',
    queuedDraftId: 'queued_005',
    draftId: 'draft_003',
    eventType: 'failed' as const,
    timestamp: new Date('2026-07-08T07:30:45Z'),
    state: 'failed' as const,
    message: 'Execution failed, will retry',
    details: {
      error: 'Gmail API timeout',
      retryAttempt: 1,
      nextRetryTime: new Date('2026-07-08T07:35:45Z'),
    },
  } as QueueEvent,

  cancelled: {
    id: 'event_005',
    queuedDraftId: 'queued_006',
    draftId: 'draft_004',
    eventType: 'cancelled' as const,
    timestamp: new Date('2026-07-08T05:45:00Z'),
    state: 'cancelled' as const,
    operator: 'manager@example.com',
    message: 'Cancelled by user request',
    details: { reason: 'Content needs revision' },
  } as QueueEvent,
};

// ============================================================================
// Mock Metrics
// ============================================================================

export const MOCK_QUEUE_METRICS = {
  healthy: {
    totalQueued: 500,
    waiting: 50,
    scheduled: 30,
    running: 5,
    completed: 390,
    failed: 15,
    cancelled: 10,
    averageWaitTime: 300,
    averageExecutionTime: 12,
    failureRate: 3,
    retryRate: 2,
    oldestItem: new Date('2026-07-08T09:00:00Z'),
    timestamp: new Date('2026-07-08T10:30:00Z'),
  } as QueueMetrics,

  stressed: {
    totalQueued: 2000,
    waiting: 500,
    scheduled: 300,
    running: 20,
    completed: 1100,
    failed: 60,
    cancelled: 20,
    averageWaitTime: 1800,
    averageExecutionTime: 45,
    failureRate: 5,
    retryRate: 8,
    oldestItem: new Date('2026-07-07T12:00:00Z'),
    timestamp: new Date('2026-07-08T10:30:00Z'),
  } as QueueMetrics,
};

export const MOCK_QUEUE_HEALTH = {
  healthy: {
    status: 'healthy' as const,
    score: 92,
    message: 'Queue operating normally',
    backlog: 80,
    avgProcessTime: 12,
    failureCount: 15,
    retryCount: 10,
  } as QueueHealth,

  degraded: {
    status: 'degraded' as const,
    score: 58,
    message: 'High failure rate detected',
    backlog: 800,
    avgProcessTime: 45,
    failureCount: 150,
    retryCount: 120,
  } as QueueHealth,

  critical: {
    status: 'critical' as const,
    score: 15,
    message: 'Critical queue backup - manual intervention required',
    backlog: 3000,
    avgProcessTime: 180,
    failureCount: 500,
    retryCount: 400,
  } as QueueHealth,
};

// ============================================================================
// Mock Queue Stats
// ============================================================================

export const MOCK_QUEUE_STATS = {
  standard: {
    created24h: 250,
    completed24h: 240,
    failed24h: 8,
    avgTurnaroundTime: 600,
    p50ExecutionTime: 10,
    p95ExecutionTime: 45,
    p99ExecutionTime: 120,
    successRate: 96.8,
    stateTransitions: [
      {
        fromState: 'waiting' as const,
        toState: 'running' as const,
        count: 240,
        averageTime: 300,
      },
      {
        fromState: 'running' as const,
        toState: 'completed' as const,
        count: 240,
        averageTime: 12,
      },
    ],
  } as QueueStats,
};

// ============================================================================
// Mock Audit Events
// ============================================================================

export const MOCK_QUEUE_AUDIT_EVENTS = {
  queued: {
    id: 'audit_001',
    queuedDraftId: 'queued_001',
    draftId: 'draft_simple',
    eventType: 'draft_queued' as const,
    timestamp: new Date('2026-07-08T10:05:30Z'),
    operator: 'approver@example.com',
    newState: 'waiting' as const,
    reason: 'Approved for execution',
  } as AuditEvent,

  started: {
    id: 'audit_002',
    queuedDraftId: 'queued_003',
    draftId: 'draft_001',
    eventType: 'queue_started' as const,
    timestamp: new Date('2026-07-08T10:00:30Z'),
    operator: 'system',
    oldState: 'scheduled' as const,
    newState: 'running' as const,
    reason: 'Scheduled time reached',
  } as AuditEvent,

  completed: {
    id: 'audit_003',
    queuedDraftId: 'queued_004',
    draftId: 'draft_002',
    eventType: 'queue_completed' as const,
    timestamp: new Date('2026-07-08T08:30:22Z'),
    operator: 'system',
    oldState: 'running' as const,
    newState: 'completed' as const,
    reason: 'Successfully sent',
    metadata: { recipientCount: 150 },
  } as AuditEvent,

  cancelled: {
    id: 'audit_004',
    queuedDraftId: 'queued_006',
    draftId: 'draft_004',
    eventType: 'queue_cancelled' as const,
    timestamp: new Date('2026-07-08T05:45:00Z'),
    operator: 'manager@example.com',
    oldState: 'waiting' as const,
    newState: 'cancelled' as const,
    reason: 'User requested cancellation',
  } as AuditEvent,
};
