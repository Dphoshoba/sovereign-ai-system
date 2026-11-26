/**
 * Workflow Audit Logger
 * 
 * Comprehensive audit trail for workflows and executions
 */

import type { WorkflowAuditEvent } from '../../src/lib/gamma-flow/types';

export interface AuditLog {
  executionId: string;
  events: WorkflowAuditEvent[];
  createdAt: Date;
  summary: AuditSummary;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  stateTransitions: StateTransition[];
  stepExecutions: StepExecution[];
  approvalDecisions: ApprovalDecision[];
  errors: AuditError[];
}

export interface StateTransition {
  from: string;
  to: string;
  timestamp: Date;
  trigger: string;
}

export interface StepExecution {
  stepId: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  error?: string;
}

export interface ApprovalDecision {
  stepId: string;
  timestamp: Date;
  approved: boolean;
  approver: string;
}

export interface AuditError {
  timestamp: Date;
  stepId?: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

export class AuditLogger {
  private logs = new Map<string, AuditLog>();

  createLog(executionId: string): AuditLog {
    const log: AuditLog = {
      executionId,
      events: [],
      createdAt: new Date(),
      summary: {
        totalEvents: 0,
        eventsByType: {},
        stateTransitions: [],
        stepExecutions: [],
        approvalDecisions: [],
        errors: [],
      },
    };

    this.logs.set(executionId, log);
    return log;
  }

  recordEvent(executionId: string, event: WorkflowAuditEvent): void {
    const log = this.logs.get(executionId);
    if (!log) {
      throw new Error(`Audit log not found for execution ${executionId}`);
    }

    log.events.push(event);

    // Update summary
    log.summary.totalEvents++;

    if (!log.summary.eventsByType[event.eventType]) {
      log.summary.eventsByType[event.eventType] = 0;
    }
    log.summary.eventsByType[event.eventType]++;

    // Parse event details
    if (
      event.eventType === 'workflow_started' ||
      event.eventType === 'workflow_completed' ||
      event.eventType === 'workflow_failed'
    ) {
      const details = event.details as any;
      if (details.from && details.to) {
        log.summary.stateTransitions.push({
          from: details.from,
          to: details.to,
          timestamp: event.timestamp,
          trigger: details.trigger || event.eventType,
        });
      }
    } else if (
      event.eventType === 'step_started' ||
      event.eventType === 'step_completed' ||
      event.eventType === 'step_failed'
    ) {
      const details = event.details as any;
      log.summary.stepExecutions.push({
        stepId: event.stepId || '',
        timestamp: event.timestamp,
        success: event.eventType === 'step_completed',
        duration: details.duration || 0,
        error: details.error,
      });

      if (!details.success) {
        log.summary.errors.push({
          timestamp: event.timestamp,
          stepId: details.stepId,
          message: details.error || 'Step execution failed',
          severity: 'error',
        });
      }
    } else if (event.eventType === 'approval_decided') {
      const details = event.details as any;
      log.summary.approvalDecisions.push({
        stepId: details.stepId,
        timestamp: event.timestamp,
        approved: details.approved,
        approver: details.approver,
      });
    }
  }

  getLog(executionId: string): AuditLog | undefined {
    return this.logs.get(executionId);
  }

  getAllLogs(): AuditLog[] {
    return Array.from(this.logs.values());
  }

  deleteLog(executionId: string): boolean {
    return this.logs.delete(executionId);
  }

  generateReport(executionId: string): AuditReport {
    const log = this.logs.get(executionId);
    if (!log) {
      throw new Error(`Audit log not found for execution ${executionId}`);
    }

    const firstEvent = log.events[0];
    const lastEvent = log.events[log.events.length - 1];

    const duration = lastEvent && firstEvent
      ? lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime()
      : 0;

    const failedSteps = log.summary.stepExecutions.filter(s => !s.success);
    const approvedCount = log.summary.approvalDecisions.filter(a => a.approved).length;
    const rejectedCount = log.summary.approvalDecisions.filter(a => !a.approved).length;

    return {
      executionId,
      duration,
      totalSteps: log.summary.stepExecutions.length,
      successfulSteps: log.summary.stepExecutions.filter(s => s.success).length,
      failedSteps: failedSteps.length,
      approvals: {
        total: log.summary.approvalDecisions.length,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      errors: log.summary.errors,
      timeline: generateTimeline(log),
    };
  }
}

export interface AuditReport {
  executionId: string;
  duration: number;
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  approvals: {
    total: number;
    approved: number;
    rejected: number;
  };
  errors: AuditError[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  details?: Record<string, any>;
}

function generateTimeline(log: AuditLog): TimelineEvent[] {
  return log.events.map(event => ({
    timestamp: event.timestamp,
    event: event.eventType,
    details: event.details,
  }));
}
