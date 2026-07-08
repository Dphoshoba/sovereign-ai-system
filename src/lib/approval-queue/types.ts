/**
 * Approval Queue Types
 * Queue management for approved drafts ready for execution
 */

import { DraftComposition } from '../gmail-drafts/types';
import { DraftPreview } from '../draft-preview/types';
import { ApprovalDecision } from '../draft-preview/types';

// ============================================================================
// Queue States
// ============================================================================

/**
 * Execution state in queue
 */
export type ExecutionState = 'waiting' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Priority levels
 */
export type QueuePriority = 'low' | 'normal' | 'high' | 'critical';

// ============================================================================
// Queued Draft
// ============================================================================

/**
 * Draft in execution queue
 */
export interface QueuedDraft {
  id: string;
  draftId: string;
  previewId: string;
  approvalId: string;
  priority: QueuePriority;
  executionState: ExecutionState;
  createdAt: Date;
  scheduledTime?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  estimatedExecutionTime?: number; // seconds
  metadata?: Record<string, any>;
}

/**
 * Queue entry with full context
 */
export interface QueueEntry {
  queued: QueuedDraft;
  draft: DraftComposition;
  preview: DraftPreview;
  approval: ApprovalDecision;
}

// ============================================================================
// Queue Operations
// ============================================================================

/**
 * Queue operation request
 */
export interface QueueRequest {
  draftId: string;
  previewId: string;
  approvalId: string;
  priority?: QueuePriority;
  scheduledTime?: Date;
  operator: string;
}

/**
 * Queue operation response
 */
export interface QueueResponse {
  success: boolean;
  queued?: QueuedDraft;
  error?: string;
  message?: string;
}

/**
 * Queue cancel request
 */
export interface CancelRequest {
  queuedDraftId: string;
  reason: string;
  operator: string;
}

/**
 * Queue retry request
 */
export interface RetryRequest {
  queuedDraftId: string;
  operator: string;
  reason?: string;
}

// ============================================================================
// Queue Lifecycle Events
// ============================================================================

export type QueueEventType = 'queued' | 'scheduled' | 'started' | 'completed' | 'failed' | 'cancelled' | 'retry';

/**
 * Queue lifecycle event
 */
export interface QueueEvent {
  id: string;
  queuedDraftId: string;
  draftId: string;
  eventType: QueueEventType;
  timestamp: Date;
  state: ExecutionState;
  operator?: string;
  message?: string;
  details?: Record<string, any>;
}

/**
 * Queue event log
 */
export interface QueueEventLog {
  queuedDraftId: string;
  events: QueueEvent[];
  lastEvent: QueueEvent;
}

// ============================================================================
// Queue Metrics
// ============================================================================

/**
 * Queue size and health metrics
 */
export interface QueueMetrics {
  totalQueued: number;
  waiting: number;
  scheduled: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageWaitTime: number; // seconds
  averageExecutionTime: number; // seconds
  failureRate: number; // percentage
  retryRate: number; // percentage
  oldestItem?: Date; // age of oldest waiting item
  timestamp: Date;
}

/**
 * Queue health status
 */
export interface QueueHealth {
  status: 'healthy' | 'degraded' | 'critical';
  score: number; // 0-100
  message: string;
  backlog: number;
  avgProcessTime: number;
  failureCount: number;
  retryCount: number;
}

// ============================================================================
// Queue Filter & Query
// ============================================================================

/**
 * Queue filter options
 */
export interface QueueFilter {
  executionState?: ExecutionState[];
  priority?: QueuePriority[];
  createdAfter?: Date;
  createdBefore?: Date;
  operator?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Queue query result
 */
export interface QueueQueryResult {
  items: QueueEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Queue Statistics
// ============================================================================

/**
 * Execution state transitions over time
 */
export interface StateTransitionStats {
  fromState: ExecutionState;
  toState: ExecutionState;
  count: number;
  averageTime: number; // seconds
}

/**
 * Queue performance statistics
 */
export interface QueueStats {
  created24h: number;
  completed24h: number;
  failed24h: number;
  avgTurnaroundTime: number; // seconds
  p50ExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  successRate: number; // percentage
  stateTransitions: StateTransitionStats[];
}

// ============================================================================
// Audit Events
// ============================================================================

export type AuditEventType = 'draft_queued' | 'queue_started' | 'queue_completed' | 'queue_failed' | 'queue_cancelled' | 'queue_retried';

/**
 * Queue audit event
 */
export interface AuditEvent {
  id: string;
  queuedDraftId: string;
  draftId: string;
  eventType: AuditEventType;
  timestamp: Date;
  operator: string;
  oldState?: ExecutionState;
  newState?: ExecutionState;
  reason?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export interface QueueConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxConcurrent: number;
  defaultPriority: QueuePriority;
  staleThresholdMs: number; // Mark as stale after X ms
  archiveAfterDays: number;
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
  maxConcurrent: 10,
  defaultPriority: 'normal',
  staleThresholdMs: 86400000, // 24 hours
  archiveAfterDays: 90,
};
