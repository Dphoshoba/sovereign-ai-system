import { describe, expect, it } from "vitest";
import {
  buildPhaseXVIReadiness,
  synthesizeIntelligenceMeshRecommendation,
  type IntelligenceMeshSignal,
} from "../../src/lib/gamma-2/intelligence-mesh";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

function signal(
  id: string,
  connectorId: IntelligenceMeshSignal["connectorId"],
  kind: IntelligenceMeshSignal["kind"],
  confidence: number
): IntelligenceMeshSignal {
  return {
    id,
    connectorId,
    kind,
    title: `${connectorId} signal`,
    confidence,
    resourceRef: `${connectorId}:${id}`,
    observedAt: BASE_TIME,
  };
}

describe("Gamma 2 Phase XVI Intelligence Mesh", () => {
  it("synthesizes a Gamma-owned recommendation across connectors", () => {
    const recommendation = synthesizeIntelligenceMeshRecommendation({
      missionId: "mission_launch_brief",
      currentTime: BASE_TIME,
      signals: [
        signal("sig_slack", "slack", "announcement-needed", 82),
        signal("sig_drive", "drive", "document-found", 90),
        signal("sig_gmail", "gmail", "inbound-message", 88),
        signal("sig_calendar", "calendar", "meeting-detected", 84),
      ],
    });

    expect(recommendation.owner).toBe("gamma");
    expect(recommendation.status).toBe("recommendation-ready");
    expect(recommendation.intent).toBe("coordinate-executive-response");
    expect(recommendation.approvalRequired).toBe(true);
    expect(recommendation.executionBoundary).toBe("preview-only");
    expect(recommendation.connectorContributions.map((item) => item.connectorId)).toEqual([
      "gmail",
      "calendar",
      "drive",
      "slack",
    ]);
  });

  it("is deterministic for identical signal input", () => {
    const input = {
      missionId: "mission_deterministic",
      currentTime: BASE_TIME,
      signals: [
        signal("sig_a", "hubspot", "crm-context", 71),
        signal("sig_b", "stripe", "payment-context", 69),
      ],
    };

    expect(synthesizeIntelligenceMeshRecommendation(input)).toEqual(
      synthesizeIntelligenceMeshRecommendation(input)
    );
  });

  it("keeps weak single-connector context in insufficient-context status", () => {
    const recommendation = synthesizeIntelligenceMeshRecommendation({
      missionId: "mission_wait",
      currentTime: BASE_TIME,
      signals: [signal("sig_one", "gmail", "inbound-message", 55)],
    });

    expect(recommendation.status).toBe("insufficient-context");
    expect(recommendation.recommendedSteps).toContain("Wait for more corroborating signals");
  });

  it("reports Phase XVI readiness from the completed connector foundation", () => {
    const readiness = buildPhaseXVIReadiness();

    expect(readiness.phase).toBe("XVI");
    expect(readiness.connectorFoundationComplete).toBe(true);
    expect(readiness.requiredConnectorCount).toBe(14);
    expect(readiness.meshRule).toBe("gamma-owns-recommendation");
  });
});
