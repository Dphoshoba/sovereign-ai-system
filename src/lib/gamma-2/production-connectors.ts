export const PHASE_XV_REQUIRED_CAPABILITIES = [
  "oauth",
  "capabilities",
  "preview",
  "approval",
  "queue",
  "audit",
  "retry",
  "certification",
  "health",
  "metrics",
] as const;

export type ProductionConnectorCapability =
  (typeof PHASE_XV_REQUIRED_CAPABILITIES)[number];

export const PHASE_XV_CONNECTOR_PRIORITY = [
  "gmail",
  "calendar",
  "drive",
  "github",
  "slack",
  "notion",
  "microsoft-365",
  "discord",
  "stripe",
  "salesforce",
  "hubspot",
  "dropbox",
  "onedrive",
  "sharepoint",
] as const;

export type PhaseXVConnectorId = (typeof PHASE_XV_CONNECTOR_PRIORITY)[number];

export type ConnectorGenerationMode = "gamma-factory" | "reference" | "manual";

export type ConnectorReadinessStatus =
  | "production-ready"
  | "certification-ready"
  | "in-progress"
  | "blocked";

export interface ConnectorReadinessInput {
  connectorId: string;
  generationMode: ConnectorGenerationMode;
  implementedCapabilities: ProductionConnectorCapability[];
  certificationScore?: number;
  manualImplementationReason?: string;
}

export interface ConnectorReadinessResult {
  connectorId: string;
  priorityRank: number | null;
  status: ConnectorReadinessStatus;
  readinessScore: number;
  missingCapabilities: ProductionConnectorCapability[];
  warnings: string[];
  blockers: string[];
  nextCapability: ProductionConnectorCapability | null;
}

function uniqueCapabilities(
  capabilities: ProductionConnectorCapability[]
): ProductionConnectorCapability[] {
  return PHASE_XV_REQUIRED_CAPABILITIES.filter((capability) =>
    capabilities.includes(capability)
  );
}

function priorityRank(connectorId: string): number | null {
  const index = PHASE_XV_CONNECTOR_PRIORITY.findIndex(
    (candidate) => candidate === connectorId
  );
  return index === -1 ? null : index + 1;
}

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

export function evaluateProductionConnectorReadiness(
  input: ConnectorReadinessInput
): ConnectorReadinessResult {
  const implementedCapabilities = uniqueCapabilities(input.implementedCapabilities);
  const missingCapabilities = PHASE_XV_REQUIRED_CAPABILITIES.filter(
    (capability) => !implementedCapabilities.includes(capability)
  );
  const warnings: string[] = [];
  const blockers: string[] = [];
  const rank = priorityRank(input.connectorId);

  if (rank === null) {
    warnings.push("Connector is outside the Gamma 2.0 Phase XV priority order.");
  }

  if (
    input.generationMode === "manual" &&
    input.connectorId !== "gmail" &&
    !input.manualImplementationReason
  ) {
    warnings.push(
      "Manual implementation requires an explicit exception because future connectors should be generated through Gamma Factory."
    );
  }

  if (missingCapabilities.length > 0) {
    blockers.push(
      `Missing Phase XV capabilities: ${missingCapabilities.join(", ")}`
    );
  }

  const capabilityScore =
    (implementedCapabilities.length / PHASE_XV_REQUIRED_CAPABILITIES.length) * 100;
  const certificationScore = input.certificationScore ?? capabilityScore;
  const readinessScore = clampScore((capabilityScore * 0.7) + (certificationScore * 0.3));

  let status: ConnectorReadinessStatus = "in-progress";
  if (blockers.length > 0) {
    status = "blocked";
  } else if (readinessScore >= 90 && certificationScore >= 90) {
    status = "production-ready";
  } else if (readinessScore >= 85) {
    status = "certification-ready";
  }

  return {
    connectorId: input.connectorId,
    priorityRank: rank,
    status,
    readinessScore,
    missingCapabilities,
    warnings,
    blockers,
    nextCapability: missingCapabilities[0] ?? null,
  };
}

export function getNextPhaseXVConnector(
  completedConnectorIds: string[]
): PhaseXVConnectorId | null {
  const completed = new Set(completedConnectorIds);
  return (
    PHASE_XV_CONNECTOR_PRIORITY.find((connectorId) => !completed.has(connectorId)) ??
    null
  );
}

export function buildPhaseXVReadinessQueue(
  connectors: ConnectorReadinessInput[]
): ConnectorReadinessResult[] {
  return connectors
    .map(evaluateProductionConnectorReadiness)
    .sort((a, b) => {
      const aRank = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
      const bRank = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return a.connectorId.localeCompare(b.connectorId);
    });
}
