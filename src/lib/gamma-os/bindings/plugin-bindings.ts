import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import type { BindingDescriptor } from "./binding-registry";

export interface PluginSourceSnapshot {
  pluginRegistryStatus: "healthy" | "degraded" | "unknown";
  moduleMarketplaceStatus: "healthy" | "degraded" | "unknown";
  capabilitiesStatus: "healthy" | "degraded" | "unknown";
  healthMetadataStatus: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
}

function aggregateHealth(
  snapshot: PluginSourceSnapshot
): "healthy" | "degraded" | "unknown" {
  const statuses = [
    snapshot.pluginRegistryStatus,
    snapshot.moduleMarketplaceStatus,
    snapshot.capabilitiesStatus,
    snapshot.healthMetadataStatus,
  ];
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((status) => status === "healthy")) return "healthy";
  return "unknown";
}

export function createPluginBindingDescriptor(
  snapshot: PluginSourceSnapshot
): BindingDescriptor {
  return {
    id: "plugin-binding",
    domain: "plugin",
    capabilities: [
      "plugin-registry",
      "module-marketplace",
      "capabilities",
      "health-version-metadata",
      "isolation-placeholder",
      "certification-placeholder",
    ],
    health: aggregateHealth(snapshot),
    source: snapshot.source,
    version: snapshot.version,
    governance: {
      approvalRequired: true,
      humanReviewRequired: true,
      auditRequired: true,
      previewOnly: true,
    },
  };
}

export function evaluatePluginBindingDispatch(
  context: PolicyEvaluationContext,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
) {
  return engine.evaluate(context);
}
