import {
  PHASE_XV_REQUIRED_CAPABILITIES,
  evaluateProductionConnectorReadiness,
  type ConnectorReadinessResult,
} from "../../../src/lib/gamma-2/production-connectors";

export function getDropboxProductionReadiness(
  certificationScore = 85
): ConnectorReadinessResult {
  return evaluateProductionConnectorReadiness({
    connectorId: "dropbox",
    generationMode: "gamma-factory",
    implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
    certificationScore,
  });
}

export function getDropboxRetryPolicy(): {
  connectorId: "dropbox";
  scheduleSeconds: number[];
  deterministic: true;
  maxAttempts: number;
} {
  return {
    connectorId: "dropbox",
    scheduleSeconds: [5, 10, 20],
    deterministic: true,
    maxAttempts: 3,
  };
}

export function projectDropboxHealth(params: {
  currentTime: Date;
  quotaUsedPercent: number;
  tokenExpiresAt: Date;
}): {
  connectorId: "dropbox";
  status: "healthy" | "degraded" | "blocked";
  checkedAt: Date;
  quotaUsedPercent: number;
  tokenMinutesUntilExpiry: number;
  warnings: string[];
} {
  const tokenMinutesUntilExpiry = Math.floor(
    (params.tokenExpiresAt.getTime() - params.currentTime.getTime()) / 60000
  );
  const warnings: string[] = [];

  if (params.quotaUsedPercent >= 90) warnings.push("Dropbox quota is above 90%.");
  if (tokenMinutesUntilExpiry < 10) {
    warnings.push("Dropbox token expires in less than 10 minutes.");
  }

  return {
    connectorId: "dropbox",
    status:
      tokenMinutesUntilExpiry <= 0
        ? "blocked"
        : warnings.length > 0
          ? "degraded"
          : "healthy",
    checkedAt: new Date(params.currentTime),
    quotaUsedPercent: params.quotaUsedPercent,
    tokenMinutesUntilExpiry,
    warnings,
  };
}
