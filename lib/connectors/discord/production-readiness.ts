import {
  PHASE_XV_REQUIRED_CAPABILITIES,
  evaluateProductionConnectorReadiness,
  type ConnectorReadinessResult,
} from "../../../src/lib/gamma-2/production-connectors";

export function getDiscordProductionReadiness(
  certificationScore = 87
): ConnectorReadinessResult {
  return evaluateProductionConnectorReadiness({
    connectorId: "discord",
    generationMode: "gamma-factory",
    implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
    certificationScore,
  });
}

export function getDiscordRetryPolicy(): {
  connectorId: "discord";
  scheduleSeconds: number[];
  deterministic: true;
  maxAttempts: number;
} {
  return {
    connectorId: "discord",
    scheduleSeconds: [5, 10, 20],
    deterministic: true,
    maxAttempts: 3,
  };
}

export function projectDiscordHealth(params: {
  currentTime: Date;
  quotaUsedPercent: number;
  tokenExpiresAt: Date;
}): {
  connectorId: "discord";
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

  if (params.quotaUsedPercent >= 90) warnings.push("Discord quota is above 90%.");
  if (tokenMinutesUntilExpiry < 10) {
    warnings.push("Discord token expires in less than 10 minutes.");
  }

  return {
    connectorId: "discord",
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
