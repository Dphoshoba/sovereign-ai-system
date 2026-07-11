import { GovernancePolicyEngine } from "../policies/governance-policy-engine";
import type { PolicyEvaluationContext } from "../policies/policy-types";
import type { BindingDescriptor } from "./binding-registry";

export interface ConnectorSourceSnapshot {
  sdkDescriptorStatus: "healthy" | "degraded" | "unknown";
  capabilityNormalizationStatus: "healthy" | "degraded" | "unknown";
  complianceStatus: "healthy" | "degraded" | "unknown";
  hardeningStatus: "healthy" | "degraded" | "unknown";
  certificationStatus: "healthy" | "degraded" | "unknown";
  connectorHealthStatus: "healthy" | "degraded" | "unknown";
  source: string;
  version: string;
}

function aggregateHealth(
  snapshot: ConnectorSourceSnapshot
): "healthy" | "degraded" | "unknown" {
  const statuses = [
    snapshot.sdkDescriptorStatus,
    snapshot.capabilityNormalizationStatus,
    snapshot.complianceStatus,
    snapshot.hardeningStatus,
    snapshot.certificationStatus,
    snapshot.connectorHealthStatus,
  ];
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.every((status) => status === "healthy")) return "healthy";
  return "unknown";
}

export function createConnectorBindingDescriptor(
  snapshot: ConnectorSourceSnapshot
): BindingDescriptor {
  return {
    id: "connector-binding",
    domain: "connector",
    capabilities: [
      "sdk-descriptor-mapping",
      "connector-capability-normalization",
      "compliance",
      "hardening",
      "certification",
      "health",
      "governance-pre-dispatch-check",
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

export function evaluateConnectorBindingDispatch(
  context: PolicyEvaluationContext,
  engine: GovernancePolicyEngine = GovernancePolicyEngine.createDefault()
) {
  return engine.evaluate(context);
}
