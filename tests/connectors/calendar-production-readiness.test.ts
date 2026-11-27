import { describe, expect, it } from "vitest";
import {
  certifyCalendarProductionConnector,
  createCalendarAuditProjection,
  createCalendarQueueProjection,
  getCalendarProductionReadiness,
  getCalendarRetryPolicy,
  projectCalendarHealth,
  projectCalendarMetrics,
} from "../../lib/connectors/calendar/production-readiness";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

describe("Calendar production readiness", () => {
  it("satisfies the Gamma 2.0 Phase XV connector contract", () => {
    const readiness = getCalendarProductionReadiness();

    expect(readiness.connectorId).toBe("calendar");
    expect(readiness.status).toBe("production-ready");
    expect(readiness.priorityRank).toBe(2);
    expect(readiness.missingCapabilities).toEqual([]);
    expect(readiness.blockers).toEqual([]);
  });

  it("creates deterministic queue projections without live execution", () => {
    const first = createCalendarQueueProjection({
      queueId: "queue-1",
      actionId: "calendar_create",
      requestedBy: "operator@gamma.local",
      approvedBy: "reviewer@gamma.local",
      currentTime: BASE_TIME,
    });
    const second = createCalendarQueueProjection({
      queueId: "queue-1",
      actionId: "calendar_create",
      requestedBy: "operator@gamma.local",
      approvedBy: "reviewer@gamma.local",
      currentTime: BASE_TIME,
    });

    expect(first).toEqual(second);
    expect(first.status).toBe("queued");
    expect(first.approvalRequired).toBe(true);
  });

  it("redacts sensitive audit metadata", () => {
    const audit = createCalendarAuditProjection({
      auditId: "audit-1",
      actionId: "calendar_create",
      actor: "operator@gamma.local",
      currentTime: BASE_TIME,
      metadata: {
        accessToken: "secret-token",
        calendarId: "cal-1",
        passwordHint: "never-log",
      },
    });

    expect(audit.immutableProjection).toBe(true);
    expect(audit.metadata.accessToken).toBe("[redacted]");
    expect(audit.metadata.passwordHint).toBe("[redacted]");
    expect(audit.metadata.calendarId).toBe("cal-1");
  });

  it("uses a deterministic retry policy", () => {
    const policy = getCalendarRetryPolicy();

    expect(policy.scheduleSeconds).toEqual([5, 10, 20]);
    expect(policy.deterministic).toBe(true);
    expect(policy.maxAttempts).toBe(3);
  });

  it("projects healthy calendar health", () => {
    const health = projectCalendarHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 40,
      tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
    });

    expect(health.status).toBe("healthy");
    expect(health.warnings).toEqual([]);
  });

  it("degrades calendar health for quota and token warnings", () => {
    const health = projectCalendarHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 95,
      tokenExpiresAt: new Date(BASE_TIME.getTime() + 5 * 60000),
    });

    expect(health.status).toBe("degraded");
    expect(health.warnings.length).toBe(2);
  });

  it("blocks calendar health when token is expired", () => {
    const health = projectCalendarHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 20,
      tokenExpiresAt: new Date(BASE_TIME.getTime() - 60000),
    });

    expect(health.status).toBe("blocked");
  });

  it("projects connector metrics from queue, audit, health, and readiness", () => {
    const queue = createCalendarQueueProjection({
      queueId: "queue-1",
      actionId: "calendar_create",
      requestedBy: "operator@gamma.local",
      currentTime: BASE_TIME,
    });
    const audit = createCalendarAuditProjection({
      auditId: "audit-1",
      actionId: "calendar_create",
      actor: "operator@gamma.local",
      currentTime: BASE_TIME,
    });
    const health = projectCalendarHealth({
      currentTime: BASE_TIME,
      quotaUsedPercent: 25,
      tokenExpiresAt: new Date(BASE_TIME.getTime() + 60 * 60000),
    });

    const metrics = projectCalendarMetrics({
      currentTime: BASE_TIME,
      queuedActions: [queue],
      auditEvents: [audit],
      health,
    });

    expect(metrics.queuedActions).toBe(1);
    expect(metrics.auditedActions).toBe(1);
    expect(metrics.healthStatus).toBe("healthy");
    expect(metrics.readinessScore).toBeGreaterThanOrEqual(90);
  });

  it("certifies Calendar when the readiness score passes", () => {
    const certification = certifyCalendarProductionConnector({
      currentTime: BASE_TIME,
      certificationScore: 92,
    });

    expect(certification.status).toBe("certified");
    expect(certification.readiness.status).toBe("production-ready");
  });

  it("rejects certification below the production readiness threshold", () => {
    expect(() =>
      certifyCalendarProductionConnector({
        currentTime: BASE_TIME,
        certificationScore: 50,
      })
    ).toThrow("not production-ready");
  });
});
