export type MarketplaceCategory =
  | "connector"
  | "workflow"
  | "mission"
  | "prompt"
  | "agent"
  | "plugin";

export interface MarketplaceArtifact {
  id: string;
  category: MarketplaceCategory;
  name: string;
  version: string;
  governanceLevel: "low" | "medium" | "high";
  requiredCapabilities: string[];
  previewAvailable: boolean;
}

export interface MarketplaceInstallRequest {
  artifact: MarketplaceArtifact;
  requestedBy: string;
  requestedAt: Date;
}

export interface MarketplaceInstallPlan {
  id: string;
  artifactId: string;
  category: MarketplaceCategory;
  version: string;
  status: "install-preview-ready" | "blocked";
  approvalRequired: boolean;
  previewOnly: true;
  auditRoute: string;
  installSteps: string[];
  blockers: string[];
  generatedAt: Date;
}

const INSTALL_STEPS: Record<MarketplaceCategory, string[]> = {
  connector: [
    "Validate connector manifest",
    "Check OAuth and capability declaration",
    "Preview connector registration",
    "Require approval before activation",
  ],
  workflow: [
    "Validate workflow definition",
    "Check approval and queue nodes",
    "Preview workflow import",
    "Require approval before activation",
  ],
  mission: [
    "Validate mission package",
    "Preview workstream decomposition",
    "Attach governance checkpoints",
    "Require approval before activation",
  ],
  prompt: [
    "Validate prompt metadata",
    "Check allowed tool boundaries",
    "Preview prompt installation",
    "Require approval before activation",
  ],
  agent: [
    "Validate agent manifest",
    "Check delegated capability boundaries",
    "Preview agent registration",
    "Require approval before activation",
  ],
  plugin: [
    "Validate plugin manifest",
    "Check exposed capabilities",
    "Preview plugin registration",
    "Require approval before activation",
  ],
};

function artifactNeedsApproval(artifact: MarketplaceArtifact): boolean {
  return (
    artifact.governanceLevel !== "low" ||
    artifact.requiredCapabilities.length > 0 ||
    artifact.category === "connector" ||
    artifact.category === "agent" ||
    artifact.category === "plugin"
  );
}

export function planMarketplaceInstall(
  request: MarketplaceInstallRequest
): MarketplaceInstallPlan {
  const blockers: string[] = [];

  if (!request.artifact.previewAvailable) {
    blockers.push("Marketplace artifact must support preview before installation.");
  }

  if (!request.artifact.version.match(/^\d+\.\d+\.\d+$/)) {
    blockers.push("Marketplace artifact version must be semver.");
  }

  const status = blockers.length === 0 ? "install-preview-ready" : "blocked";

  return {
    id: `install_${request.artifact.id}_${request.artifact.version.replace(/\./g, "_")}`,
    artifactId: request.artifact.id,
    category: request.artifact.category,
    version: request.artifact.version,
    status,
    approvalRequired: artifactNeedsApproval(request.artifact),
    previewOnly: true,
    auditRoute: `audit://gamma/marketplace/${request.artifact.category}/${request.artifact.id}`,
    installSteps: INSTALL_STEPS[request.artifact.category],
    blockers,
    generatedAt: new Date(request.requestedAt),
  };
}

export function buildPhaseXVIIIReadiness(): {
  phase: "XVIII";
  name: "Marketplace";
  categories: MarketplaceCategory[];
  marketplaceRule: "everything-versioned-governed-previewed";
} {
  return {
    phase: "XVIII",
    name: "Marketplace",
    categories: ["connector", "workflow", "mission", "prompt", "agent", "plugin"],
    marketplaceRule: "everything-versioned-governed-previewed",
  };
}
