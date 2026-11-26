import {
  PHASE_XV_CONNECTOR_PRIORITY,
  type PhaseXVConnectorId,
} from "./production-connectors";

export type MeshSignalKind =
  | "inbound-message"
  | "meeting-detected"
  | "document-found"
  | "repository-found"
  | "announcement-needed"
  | "payment-context"
  | "crm-context"
  | "knowledge-context";

export interface IntelligenceMeshSignal {
  id: string;
  connectorId: PhaseXVConnectorId;
  kind: MeshSignalKind;
  title: string;
  confidence: number;
  resourceRef: string;
  observedAt: Date;
}

export interface IntelligenceMeshInput {
  missionId: string;
  currentTime: Date;
  signals: IntelligenceMeshSignal[];
}

export interface ConnectorContribution {
  connectorId: PhaseXVConnectorId;
  signalCount: number;
  strongestSignalId: string;
  confidence: number;
}

export interface IntelligenceMeshRecommendation {
  id: string;
  missionId: string;
  owner: "gamma";
  status: "recommendation-ready" | "insufficient-context";
  intent:
    | "coordinate-executive-response"
    | "prepare-customer-follow-up"
    | "organize-knowledge-work"
    | "monitor-context";
  summary: string;
  confidenceScore: number;
  connectorContributions: ConnectorContribution[];
  recommendedSteps: string[];
  approvalRequired: true;
  executionBoundary: "preview-only";
  auditRoute: string;
  generatedAt: Date;
}

function clampConfidence(confidence: number): number {
  if (confidence < 0) return 0;
  if (confidence > 100) return 100;
  return Math.round(confidence);
}

function normalizeSignals(signals: IntelligenceMeshSignal[]): IntelligenceMeshSignal[] {
  return [...signals].sort((a, b) => {
    const connectorDelta =
      PHASE_XV_CONNECTOR_PRIORITY.indexOf(a.connectorId) -
      PHASE_XV_CONNECTOR_PRIORITY.indexOf(b.connectorId);
    if (connectorDelta !== 0) return connectorDelta;
    return a.id.localeCompare(b.id);
  });
}

function buildContributions(signals: IntelligenceMeshSignal[]): ConnectorContribution[] {
  const byConnector = new Map<PhaseXVConnectorId, IntelligenceMeshSignal[]>();
  normalizeSignals(signals).forEach((signal) => {
    byConnector.set(signal.connectorId, [
      ...(byConnector.get(signal.connectorId) ?? []),
      signal,
    ]);
  });

  return Array.from(byConnector.entries()).map(([connectorId, connectorSignals]) => {
    const strongest = [...connectorSignals].sort((a, b) => {
      const confidenceDelta = b.confidence - a.confidence;
      if (confidenceDelta !== 0) return confidenceDelta;
      return a.id.localeCompare(b.id);
    })[0];

    const average =
      connectorSignals.reduce((sum, signal) => sum + clampConfidence(signal.confidence), 0) /
      connectorSignals.length;

    return {
      connectorId,
      signalCount: connectorSignals.length,
      strongestSignalId: strongest.id,
      confidence: clampConfidence(average),
    };
  });
}

function classifyIntent(signals: IntelligenceMeshSignal[]): IntelligenceMeshRecommendation["intent"] {
  const kinds = new Set(signals.map((signal) => signal.kind));
  const connectors = new Set(signals.map((signal) => signal.connectorId));

  if (
    connectors.has("gmail") &&
    connectors.has("calendar") &&
    connectors.has("drive") &&
    connectors.has("slack")
  ) {
    return "coordinate-executive-response";
  }

  if (connectors.has("salesforce") || connectors.has("hubspot") || connectors.has("stripe")) {
    return "prepare-customer-follow-up";
  }

  if (
    kinds.has("document-found") ||
    connectors.has("notion") ||
    connectors.has("sharepoint") ||
    connectors.has("onedrive")
  ) {
    return "organize-knowledge-work";
  }

  return "monitor-context";
}

function buildSteps(intent: IntelligenceMeshRecommendation["intent"]): string[] {
  if (intent === "coordinate-executive-response") {
    return [
      "Summarize inbound context",
      "Attach relevant calendar, document, and repository references",
      "Draft Slack announcement preview",
      "Request human approval before queueing any connector write",
    ];
  }

  if (intent === "prepare-customer-follow-up") {
    return [
      "Summarize customer and payment context",
      "Prepare CRM follow-up preview",
      "Route through approval checkpoint",
      "Queue approved connector write only after governance review",
    ];
  }

  if (intent === "organize-knowledge-work") {
    return [
      "Collect referenced knowledge resources",
      "Prepare workspace summary",
      "Recommend ownership and next checkpoint",
      "Keep all external writes preview-only",
    ];
  }

  return [
    "Monitor connector context",
    "Wait for more corroborating signals",
    "Keep recommendation in preview state",
  ];
}

export function synthesizeIntelligenceMeshRecommendation(
  input: IntelligenceMeshInput
): IntelligenceMeshRecommendation {
  const signals = normalizeSignals(input.signals);
  const contributions = buildContributions(signals);
  const confidenceScore =
    contributions.length === 0
      ? 0
      : clampConfidence(
          contributions.reduce((sum, contribution) => sum + contribution.confidence, 0) /
            contributions.length
        );
  const intent = classifyIntent(signals);
  const status =
    contributions.length >= 2 && confidenceScore >= 60
      ? "recommendation-ready"
      : "insufficient-context";

  return {
    id: `mesh_${input.missionId}`,
    missionId: input.missionId,
    owner: "gamma",
    status,
    intent,
    summary:
      status === "recommendation-ready"
        ? `Gamma synthesized ${contributions.length} connector contexts into a governed recommendation.`
        : "Gamma needs more corroborating connector context before recommending action.",
    confidenceScore,
    connectorContributions: contributions,
    recommendedSteps: buildSteps(intent),
    approvalRequired: true,
    executionBoundary: "preview-only",
    auditRoute: `audit://gamma/intelligence-mesh/${input.missionId}`,
    generatedAt: new Date(input.currentTime),
  };
}

export function buildPhaseXVIReadiness(): {
  phase: "XVI";
  name: "Intelligence Mesh";
  connectorFoundationComplete: boolean;
  requiredConnectorCount: number;
  meshRule: "gamma-owns-recommendation";
} {
  return {
    phase: "XVI",
    name: "Intelligence Mesh",
    connectorFoundationComplete: PHASE_XV_CONNECTOR_PRIORITY.length === 14,
    requiredConnectorCount: PHASE_XV_CONNECTOR_PRIORITY.length,
    meshRule: "gamma-owns-recommendation",
  };
}
