/**
 * Execution Audit Log
 * Immutable append-only audit trail for all executions
 */

import { ExecutionAuditEvent, AuditEventType } from '../../../src/lib/gmail-execution/types';

export class ExecutionAuditLog {
  private events: Map<string, ExecutionAuditEvent[]> = new Map();
  private eventIdCounter: number = 0;

  /**
   * Record an audit event (append-only)
   */
  recordEvent(
    executionId: string,
    eventType: AuditEventType,
    operator: string,
    timestamp: Date,
    details: any = {}
  ): ExecutionAuditEvent {
    const event: ExecutionAuditEvent = {
      id: `audit_${executionId}_${++this.eventIdCounter}`,
      executionId,
      eventType,
      operator,
      timestamp,
      details,
      immutable: true,
    };

    if (!this.events.has(executionId)) {
      this.events.set(executionId, []);
    }

    this.events.get(executionId)!.push(event);
    return event;
  }

  /**
   * Get audit trail for execution
   */
  getAuditTrail(executionId: string): ExecutionAuditEvent[] {
    return this.events.get(executionId) || [];
  }

  /**
   * Get all events of specific type
   */
  getEventsByType(eventType: AuditEventType): ExecutionAuditEvent[] {
    const allEvents: ExecutionAuditEvent[] = [];

    for (const events of this.events.values()) {
      allEvents.push(...events.filter(e => e.eventType === eventType));
    }

    return allEvents;
  }

  /**
   * Get events by operator
   */
  getEventsByOperator(operator: string): ExecutionAuditEvent[] {
    const allEvents: ExecutionAuditEvent[] = [];

    for (const events of this.events.values()) {
      allEvents.push(...events.filter(e => e.operator === operator));
    }

    return allEvents;
  }

  /**
   * Get all events (for compliance reporting)
   */
  getAllEvents(): ExecutionAuditEvent[] {
    const allEvents: ExecutionAuditEvent[] = [];

    for (const events of this.events.values()) {
      allEvents.push(...events);
    }

    // Sort by timestamp
    return allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get complete execution timeline
   */
  getExecutionTimeline(executionId: string) {
    const trail = this.getAuditTrail(executionId);

    return {
      executionId,
      totalEvents: trail.length,
      startTime: trail.length > 0 ? trail[0].timestamp : undefined,
      endTime: trail.length > 0 ? trail[trail.length - 1].timestamp : undefined,
      timeline: trail.map(e => ({
        time: e.timestamp,
        event: e.eventType,
        operator: e.operator,
        details: e.details,
      })),
    };
  }

  /**
   * Verify audit integrity (immutable and chronological)
   */
  verifyIntegrity(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const [executionId, events] of this.events) {
      // Check immutable flag
      for (const event of events) {
        if (!event.immutable) {
          issues.push(`Event ${event.id} in execution ${executionId} is not marked immutable`);
        }
      }

      // Check chronological order
      for (let i = 1; i < events.length; i++) {
        if (events[i].timestamp < events[i - 1].timestamp) {
          issues.push(`Events in execution ${executionId} are not in chronological order`);
          break;
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate audit report for compliance
   */
  generateComplianceReport(startTime: Date, endTime: Date) {
    const allEvents = this.getAllEvents().filter(e => e.timestamp >= startTime && e.timestamp <= endTime);

    const eventCounts: Record<AuditEventType, number> = {
      execution_started: 0,
      execution_safety_checked: 0,
      gmail_draft_created: 0,
      gmail_send_completed: 0,
      execution_failed: 0,
      execution_retried: 0,
      execution_cancelled: 0,
      execution_dead_lettered: 0,
    };

    const operatorActions: Record<string, number> = {};

    for (const event of allEvents) {
      eventCounts[event.eventType]++;
      operatorActions[event.operator] = (operatorActions[event.operator] || 0) + 1;
    }

    return {
      period: {
        start: startTime,
        end: endTime,
      },
      totalEvents: allEvents.length,
      eventCounts,
      operatorActions,
      topOperators: Object.entries(operatorActions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      integrityCheck: this.verifyIntegrity(),
    };
  }

  /**
   * Export audit log as JSON (for external systems)
   */
  exportAsJSON(executionId?: string) {
    let events: ExecutionAuditEvent[];

    if (executionId) {
      events = this.getAuditTrail(executionId);
    } else {
      events = this.getAllEvents();
    }

    return {
      exported: new Date().toISOString(),
      eventCount: events.length,
      events: events.map(e => ({
        id: e.id,
        executionId: e.executionId,
        eventType: e.eventType,
        operator: e.operator,
        timestamp: e.timestamp.toISOString(),
        details: e.details,
      })),
    };
  }

  /**
   * Get audit statistics
   */
  getStats() {
    const allEvents = this.getAllEvents();

    const stats = {
      totalEvents: allEvents.length,
      totalExecutions: this.events.size,
      eventTypeBreakdown: {} as Record<AuditEventType, number>,
      operatorBreakdown: {} as Record<string, number>,
      avgEventsPerExecution: this.events.size > 0 ? allEvents.length / this.events.size : 0,
    };

    for (const event of allEvents) {
      stats.eventTypeBreakdown[event.eventType] = (stats.eventTypeBreakdown[event.eventType] || 0) + 1;
      stats.operatorBreakdown[event.operator] = (stats.operatorBreakdown[event.operator] || 0) + 1;
    }

    return stats;
  }
}
