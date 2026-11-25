import {
  PHASE_XV_REQUIRED_CAPABILITIES,
  evaluateProductionConnectorReadiness,
  type ConnectorReadinessResult,
} from "../../../src/lib/gamma-2/production-connectors";

export type CalendarProductionStatus = "healthy" | "degraded" | "blocked";

export interface CalendarQueueProjection {
  queueId: string;
  connectorId: "calendar";
  actionId: string;
  status: "queued";
  approvalRequired: true;
  auditId: string;
  requestedBy: string;
  approvedBy?: string;
  queuedAt: Date;
}

export interface CalendarAuditProjection {
  auditId: string;
  connectorId: "calendar";
  actionId: string;
  actor: string;
  recordedAt: Date;
  immutableProjection: true;
  metadata: Record<string, unknown>;
}

export interface CalendarRetryPolicy {
  connectorId: "calendar";
  scheduleSeconds: number[];
  deterministic: true;
  maxAttempts: number;
}

export interface CalendarHealthProjection {
  connectorId: "calendar";
  status: CalendarProductionStatus;
  checkedAt: Date;
  quotaUsedPercent: number;
  tokenMinutesUntilExpiry: number;
  warnings: string[];
}

export interface CalendarMetricsProjection {
  connectorId: "calendar";
  measuredAt: Date;
  queuedActions: number;
  auditedActions: number;
  healthStatus: CalendarProductionStatus;
  readinessScore: number;
}

export interface CalendarCertificationProjection {
  connectorId: "calendar";
  status: "certified";
  certifiedAt: Date;
  score: number;
  readiness: ConnectorReadinessResult;
}

function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const lowered = key.toLowerCase();
        if (
          lowered.includes("token") ||
          lowered.includes("secret") ||
          lowered.includes("password")
        ) {
          return [key, "[redacted]"];
        }
        return [key, value];
      })
  );
}

export function getCalendarProductionReadiness(
  certificationScore = 91
): ConnectorReadinessResult {
  return evaluateProductionConnectorReadiness({
    connectorId: "calendar",
    generationMode: "gamma-factory",
    implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
    certificationScore,
  });
}

export function createCalendarQueueProjection(params: {
  queueId: string;
  actionId: string;
  requestedBy: string;
  currentTime: Date;
  approvedBy?: string;
}): CalendarQueueProjection {
  return {
    queueId: params.queueId,
    connectorId: "calendar",
    actionId: params.actionId,
    status: "queued",
    approvalRequired: true,
    auditId: `calendar-audit:${params.queueId}`,
    requestedBy: params.requestedBy,
    approvedBy: params.approvedBy,
    queuedAt: new Date(params.currentTime),
  };
}

export function createCalendarAuditProjection(params: {
  auditId: string;
  actionId: string;
  actor: string;
  currentTime: Date;
  metadata?: Record<string, unknown>;
}): CalendarAuditProjection {
  return {
    auditId: params.auditId,
    connectorId: "calendar",
    actionId: params.actionId,
    actor: params.actor,
    recordedAt: new Date(params.currentTime),
    immutableProjection: true,
    metadata: sanitizeMetadata(params.metadata ?? {}),
  };
}

export function getCalendarRetryPolicy(): CalendarRetryPolicy {
  return {
    connectorId: "calendar",
    scheduleSeconds: [5, 10, 20],
    deterministic: true,
    maxAttempts: 3,
  };
}

export function projectCalendarHealth(params: {
  currentTime: Date;
  quotaUsedPercent: number;
  tokenExpiresAt: Date;
}): CalendarHealthProjection {
  const tokenMinutesUntilExpiry = Math.floor(
    (params.tokenExpiresAt.getTime() - params.currentTime.getTime()) / 60000
  );
  const warnings: string[] = [];

  if (params.quotaUsedPercent >= 90) {
    warnings.push("Calendar quota is above 90%.");
  }

  if (tokenMinutesUntilExpiry < 10) {
    warnings.push("Calendar token expires in less than 10 minutes.");
  }

  const status: CalendarProductionStatus =
    warnings.length === 0
      ? "healthy"
      : tokenMinutesUntilExpiry <= 0
        ? "blocked"
        : "degraded";

  return {
    connectorId: "calendar",
    status,
    checkedAt: new Date(params.currentTime),
    quotaUsedPercent: params.quotaUsedPercent,
    tokenMinutesUntilExpiry,
    warnings,
  };
}

export function projectCalendarMetrics(params: {
  currentTime: Date;
  queuedActions: CalendarQueueProjection[];
  auditEvents: CalendarAuditProjection[];
  health: CalendarHealthProjection;
}): CalendarMetricsProjection {
  return {
    connectorId: "calendar",
    measuredAt: new Date(params.currentTime),
    queuedActions: params.queuedActions.length,
    auditedActions: params.auditEvents.length,
    healthStatus: params.health.status,
    readinessScore: getCalendarProductionReadiness().readinessScore,
  };
}

export function certifyCalendarProductionConnector(params: {
  currentTime: Date;
  certificationScore?: number;
}): CalendarCertificationProjection {
  const readiness = getCalendarProductionReadiness(params.certificationScore);
  if (readiness.status !== "production-ready") {
    throw new Error("Calendar connector is not production-ready.");
  }

  return {
    connectorId: "calendar",
    status: "certified",
    certifiedAt: new Date(params.currentTime),
    score: readiness.readinessScore,
    readiness,
  };
}
