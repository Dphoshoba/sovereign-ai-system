import { describe, expect, it } from "vitest";
import {
  buildPhaseXVIIIReadiness,
  planMarketplaceInstall,
  type MarketplaceArtifact,
} from "../../src/lib/gamma-2/marketplace";

const BASE_TIME = new Date("2026-07-11T00:00:00.000Z");

const connectorArtifact: MarketplaceArtifact = {
  id: "gmail-priority-router",
  category: "workflow",
  name: "Gmail Priority Router",
  version: "1.0.0",
  governanceLevel: "medium",
  requiredCapabilities: ["gmail.read", "slack.preview"],
  previewAvailable: true,
};

describe("Gamma 2 Phase XVIII Marketplace", () => {
  it("plans governed preview installation for marketplace artifacts", () => {
    const plan = planMarketplaceInstall({
      artifact: connectorArtifact,
      requestedBy: "operator",
      requestedAt: BASE_TIME,
    });

    expect(plan.status).toBe("install-preview-ready");
    expect(plan.approvalRequired).toBe(true);
    expect(plan.previewOnly).toBe(true);
    expect(plan.auditRoute).toBe("audit://gamma/marketplace/workflow/gmail-priority-router");
    expect(plan.installSteps).toContain("Require approval before activation");
  });

  it("blocks artifacts that cannot be previewed or versioned", () => {
    const plan = planMarketplaceInstall({
      artifact: {
        ...connectorArtifact,
        version: "latest",
        previewAvailable: false,
      },
      requestedBy: "operator",
      requestedAt: BASE_TIME,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "Marketplace artifact must support preview before installation.",
      "Marketplace artifact version must be semver.",
    ]);
  });

  it("is deterministic for identical install requests", () => {
    const request = {
      artifact: connectorArtifact,
      requestedBy: "operator",
      requestedAt: BASE_TIME,
    };

    expect(planMarketplaceInstall(request)).toEqual(planMarketplaceInstall(request));
  });

  it("reports Phase XVIII readiness categories", () => {
    const readiness = buildPhaseXVIIIReadiness();

    expect(readiness.phase).toBe("XVIII");
    expect(readiness.categories).toEqual([
      "connector",
      "workflow",
      "mission",
      "prompt",
      "agent",
      "plugin",
    ]);
    expect(readiness.marketplaceRule).toBe("everything-versioned-governed-previewed");
  });
});
