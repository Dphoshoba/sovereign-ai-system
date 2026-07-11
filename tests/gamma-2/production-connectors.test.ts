import { describe, expect, it } from "vitest";
import {
  PHASE_XV_CONNECTOR_PRIORITY,
  PHASE_XV_REQUIRED_CAPABILITIES,
  buildPhaseXVReadinessQueue,
  evaluateProductionConnectorReadiness,
  getNextPhaseXVConnector,
} from "../../src/lib/gamma-2/production-connectors";

describe("Gamma 2.0 Phase XV production connector readiness", () => {
  it("keeps the master roadmap connector capability contract stable", () => {
    expect(PHASE_XV_REQUIRED_CAPABILITIES).toEqual([
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
    ]);
  });

  it("keeps Gmail then Calendar as the first production connector priorities", () => {
    expect(PHASE_XV_CONNECTOR_PRIORITY.slice(0, 2)).toEqual([
      "gmail",
      "calendar",
    ]);
  });

  it("marks certified Gmail as production-ready", () => {
    const result = evaluateProductionConnectorReadiness({
      connectorId: "gmail",
      generationMode: "reference",
      implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
      certificationScore: 94,
    });

    expect(result.status).toBe("production-ready");
    expect(result.readinessScore).toBeGreaterThanOrEqual(90);
    expect(result.missingCapabilities).toEqual([]);
    expect(result.priorityRank).toBe(1);
  });

  it("identifies the next missing Calendar capability in roadmap order", () => {
    const result = evaluateProductionConnectorReadiness({
      connectorId: "calendar",
      generationMode: "gamma-factory",
      implementedCapabilities: ["oauth", "capabilities", "preview", "approval"],
      certificationScore: 40,
    });

    expect(result.status).toBe("blocked");
    expect(result.nextCapability).toBe("queue");
    expect(result.missingCapabilities).toEqual([
      "queue",
      "audit",
      "retry",
      "certification",
      "health",
      "metrics",
    ]);
  });

  it("warns when a future connector is manual without an exception", () => {
    const result = evaluateProductionConnectorReadiness({
      connectorId: "drive",
      generationMode: "manual",
      implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
      certificationScore: 91,
    });

    expect(result.status).toBe("production-ready");
    expect(result.warnings.join(" ")).toContain("Gamma Factory");
  });

  it("selects Calendar after Gmail completion", () => {
    expect(getNextPhaseXVConnector(["gmail"])).toBe("calendar");
  });

  it("sorts readiness queue by Phase XV priority order", () => {
    const queue = buildPhaseXVReadinessQueue([
      {
        connectorId: "drive",
        generationMode: "gamma-factory",
        implementedCapabilities: ["oauth"],
      },
      {
        connectorId: "gmail",
        generationMode: "reference",
        implementedCapabilities: [...PHASE_XV_REQUIRED_CAPABILITIES],
        certificationScore: 94,
      },
      {
        connectorId: "calendar",
        generationMode: "gamma-factory",
        implementedCapabilities: ["oauth", "capabilities"],
      },
    ]);

    expect(queue.map((item) => item.connectorId)).toEqual([
      "gmail",
      "calendar",
      "drive",
    ]);
  });
});
