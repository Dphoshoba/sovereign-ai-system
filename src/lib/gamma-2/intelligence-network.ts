import { PHASE_XV_CONNECTOR_PRIORITY, type PhaseXVConnectorId } from "./production-connectors";

export type GammaNetworkNode =
  | "gamma-core"
  | "governance-policy-engine"
  | "runtime-state-machine"
  | "mission-orchestrator"
  | "production-connectors"
  | "agent-collaboration"
  | "human-approval-layer"
  | "audit-compliance-engine"
  | "executive-intelligence";

export type GammaProductSurface =
  | "bible-quest"
  | "menwise360"
  | "visioncraft"
  | "inspirevoice"
  | "creator-studio"
  | "ai-blog-automation"
  | "future-products";

export type GammaSharedSystem =
  | "governance-engine"
  | "orchestration-engine"
  | "runtime"
  | "knowledge-graph"
  | "mission-planner";

export interface GammaProductIntegration {
  product: GammaProductSurface;
  sharedSystems: GammaSharedSystem[];
}

export interface GammaIntelligenceNetworkInput {
  networkId: string;
  currentTime: Date;
  enabledNodes: GammaNetworkNode[];
  connectors: PhaseXVConnectorId[];
  products: GammaProductIntegration[];
}

export interface GammaProductGap {
  product: GammaProductSurface;
  missingSharedSystems: GammaSharedSystem[];
}

export interface GammaIntelligenceNetworkReadiness {
  id: string;
  networkId: string;
  status: "gamma-network-ready" | "blocked";
  enabledNodes: GammaNetworkNode[];
  missingNodes: GammaNetworkNode[];
  connectors: PhaseXVConnectorId[];
  missingConnectors: PhaseXVConnectorId[];
  products: GammaProductIntegration[];
  missingProducts: GammaProductSurface[];
  productGaps: GammaProductGap[];
  sharedSystems: GammaSharedSystem[];
  networkRule: "one-governed-network-benefits-every-product";
  generatedAt: Date;
}

export const PHASE_XXV_NETWORK_NODES: GammaNetworkNode[] = [
  "gamma-core",
  "governance-policy-engine",
  "runtime-state-machine",
  "mission-orchestrator",
  "production-connectors",
  "agent-collaboration",
  "human-approval-layer",
  "audit-compliance-engine",
  "executive-intelligence",
];

export const PHASE_XXV_PRODUCT_LAYER: GammaProductSurface[] = [
  "bible-quest",
  "menwise360",
  "visioncraft",
  "inspirevoice",
  "creator-studio",
  "ai-blog-automation",
  "future-products",
];

export const PHASE_XXV_SHARED_SYSTEMS: GammaSharedSystem[] = [
  "governance-engine",
  "orchestration-engine",
  "runtime",
  "knowledge-graph",
  "mission-planner",
];

function normalizeNodes(nodes: GammaNetworkNode[]): GammaNetworkNode[] {
  return PHASE_XXV_NETWORK_NODES.filter((node) => nodes.includes(node));
}

function normalizeConnectors(connectors: PhaseXVConnectorId[]): PhaseXVConnectorId[] {
  return PHASE_XV_CONNECTOR_PRIORITY.filter((connector) => connectors.includes(connector));
}

function normalizeProducts(products: GammaProductIntegration[]): GammaProductIntegration[] {
  return PHASE_XXV_PRODUCT_LAYER.flatMap((product) => {
    const match = products.find((item) => item.product === product);
    if (!match) return [];
    return [
      {
        product,
        sharedSystems: PHASE_XXV_SHARED_SYSTEMS.filter((system) =>
          match.sharedSystems.includes(system)
        ),
      },
    ];
  });
}

export function buildGammaIntelligenceNetworkReadiness(
  input: GammaIntelligenceNetworkInput
): GammaIntelligenceNetworkReadiness {
  const enabledNodes = normalizeNodes(input.enabledNodes);
  const connectors = normalizeConnectors(input.connectors);
  const products = normalizeProducts(input.products);
  const missingNodes = PHASE_XXV_NETWORK_NODES.filter((node) => !enabledNodes.includes(node));
  const missingConnectors = PHASE_XV_CONNECTOR_PRIORITY.filter(
    (connector) => !connectors.includes(connector)
  );
  const missingProducts = PHASE_XXV_PRODUCT_LAYER.filter(
    (product) => !products.some((item) => item.product === product)
  );
  const productGaps = products
    .map((product) => ({
      product: product.product,
      missingSharedSystems: PHASE_XXV_SHARED_SYSTEMS.filter(
        (system) => !product.sharedSystems.includes(system)
      ),
    }))
    .filter((gap) => gap.missingSharedSystems.length > 0);

  return {
    id: `gamma_network_${input.networkId}`,
    networkId: input.networkId,
    status:
      missingNodes.length === 0 &&
      missingConnectors.length === 0 &&
      missingProducts.length === 0 &&
      productGaps.length === 0
        ? "gamma-network-ready"
        : "blocked",
    enabledNodes,
    missingNodes,
    connectors,
    missingConnectors,
    products,
    missingProducts,
    productGaps,
    sharedSystems: [...PHASE_XXV_SHARED_SYSTEMS],
    networkRule: "one-governed-network-benefits-every-product",
    generatedAt: new Date(input.currentTime),
  };
}

export function buildPhaseXXVReadiness(): {
  phase: "XXV";
  name: "Gamma Intelligence Network";
  nodes: GammaNetworkNode[];
  productLayer: GammaProductSurface[];
  sharedSystems: GammaSharedSystem[];
  networkRule: "one-governed-network-benefits-every-product";
} {
  return {
    phase: "XXV",
    name: "Gamma Intelligence Network",
    nodes: [...PHASE_XXV_NETWORK_NODES],
    productLayer: [...PHASE_XXV_PRODUCT_LAYER],
    sharedSystems: [...PHASE_XXV_SHARED_SYSTEMS],
    networkRule: "one-governed-network-benefits-every-product",
  };
}
