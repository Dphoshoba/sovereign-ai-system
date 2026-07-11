import {
  PHASE_XV_REQUIRED_CAPABILITIES,
  evaluateProductionConnectorReadiness,
  type ConnectorReadinessResult,
} from "../../../src/lib/gamma-2/production-connectors";

export function getOneDriveProductionReadiness(
  certificationScore = 85
): ConnectorReadinessResult {
  return evaluateProductionConnectorReadiness({
    connectorId: "onedrive",
    generationMode: "gamma-factory",
    implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
    certificationScore,
  });
}

export function getOneDriveRetryPolicy(): {
  connectorId: "onedrive";
  scheduleSeconds: number[];
  deterministic: true;
  maxAttempts: number;
} {
  return {
    connectorId: "onedrive",
    scheduleSeconds: [5, 10, 20],
    deterministic: true,
    maxAttempts: 3,
  };
}

export function projectOneDriveHealth(params: {
  currentTime: Date;
  quotaUsedPercent: number;
  tokenExpiresAt: Date;
}): {
  connectorId: "onedrive";
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

  if (params.quotaUsedPercent >= 90) warnings.push("OneDrive quota is above 90%.");
  if (tokenMinutesUntilExpiry < 10) {
    warnings.push("OneDrive token expires in less than 10 minutes.");
  }

  return {
    connectorId: "onedrive",
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
