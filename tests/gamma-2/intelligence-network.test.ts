import { describe, expect, it } from "vitest";
import { PHASE_XV_CONNECTOR_PRIORITY } from "../../src/lib/gamma-2/production-connectors";
import {
  PHASE_XXV_NETWORK_NODES,
  PHASE_XXV_PRODUCT_LAYER,
  PHASE_XXV_SHARED_SYSTEMS,
  buildGammaIntelligenceNetworkReadiness,
  buildPhaseXXVReadiness,
  type GammaProductIntegration,
} from "../../src/lib/gamma-2/intelligence-network";

const BASE_TIME = new Date("2026-07-12T00:00:00.000Z");

function product(product: GammaProductIntegration["product"]): GammaProductIntegration {
  return {
    product,
    sharedSystems: [...PHASE_XXV_SHARED_SYSTEMS],
  };
}

describe("Gamma 2 Phase XXV Gamma Intelligence Network", () => {
  it("marks the network ready when every node, connector, and product shares the same systems", () => {
    const readiness = buildGammaIntelligenceNetworkReadiness({
      networkId: "complete",
      currentTime: BASE_TIME,
      enabledNodes: [...PHASE_XXV_NETWORK_NODES],
      connectors: [...PHASE_XV_CONNECTOR_PRIORITY],
      products: PHASE_XXV_PRODUCT_LAYER.map(product),
    });

    expect(readiness.status).toBe("gamma-network-ready");
    expect(readiness.missingNodes).toEqual([]);
    expect(readiness.missingConnectors).toEqual([]);
    expect(readiness.missingProducts).toEqual([]);
    expect(readiness.productGaps).toEqual([]);
  });

  it("blocks missing network nodes and connectors", () => {
    const readiness = buildGammaIntelligenceNetworkReadiness({
      networkId: "missing-foundation",
      currentTime: BASE_TIME,
      enabledNodes: PHASE_XXV_NETWORK_NODES.filter((node) => node !== "executive-intelligence"),
      connectors: PHASE_XV_CONNECTOR_PRIORITY.filter((connector) => connector !== "gmail"),
      products: PHASE_XXV_PRODUCT_LAYER.map(product),
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.missingNodes).toEqual(["executive-intelligence"]);
    expect(readiness.missingConnectors).toEqual(["gmail"]);
  });

  it("blocks products that do not share the common Gamma systems", () => {
    const readiness = buildGammaIntelligenceNetworkReadiness({
      networkId: "product-gap",
      currentTime: BASE_TIME,
      enabledNodes: [...PHASE_XXV_NETWORK_NODES],
      connectors: [...PHASE_XV_CONNECTOR_PRIORITY],
      products: [
        {
          product: "bible-quest",
          sharedSystems: ["governance-engine", "runtime"],
        },
        ...PHASE_XXV_PRODUCT_LAYER.filter((item) => item !== "bible-quest").map(product),
      ],
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.productGaps).toEqual([
      {
        product: "bible-quest",
        missingSharedSystems: ["orchestration-engine", "knowledge-graph", "mission-planner"],
      },
    ]);
  });

  it("is deterministic for identical network input", () => {
    const input = {
      networkId: "deterministic",
      currentTime: BASE_TIME,
      enabledNodes: [...PHASE_XXV_NETWORK_NODES],
      connectors: [...PHASE_XV_CONNECTOR_PRIORITY],
      products: PHASE_XXV_PRODUCT_LAYER.map(product),
    };

    expect(buildGammaIntelligenceNetworkReadiness(input)).toEqual(
      buildGammaIntelligenceNetworkReadiness(input)
    );
  });

  it("reports Phase XXV readiness", () => {
    const readiness = buildPhaseXXVReadiness();

    expect(readiness.phase).toBe("XXV");
    expect(readiness.nodes).toEqual(PHASE_XXV_NETWORK_NODES);
    expect(readiness.productLayer).toEqual(PHASE_XXV_PRODUCT_LAYER);
    expect(readiness.sharedSystems).toEqual(PHASE_XXV_SHARED_SYSTEMS);
    expect(readiness.networkRule).toBe("one-governed-network-benefits-every-product");
  });
});
