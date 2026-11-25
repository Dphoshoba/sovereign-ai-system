import type { PolicyEvaluator } from "./policy-types";

const BLOCKED_CONNECTORS = new Set<string>(["custom-unsafe", "unknown"]);

export const connectorPolicy: PolicyEvaluator = {
  id: "connector-restrictions",
  category: "connector",
  order: 70,
  evaluate(input) {
    const blocked = input.context.connectorIds.filter((id) =>
      BLOCKED_CONNECTORS.has(id)
    );
    const hasBlockedConnector = blocked.length > 0;

    return {
      policyId: "connector-restrictions",
      category: "connector",
      severity: hasBlockedConnector ? "critical" : "info",
      blocking: hasBlockedConnector,
      passed: !hasBlockedConnector,
      reason: hasBlockedConnector
        ? `Restricted connectors detected: ${blocked.join(", ")}`
        : "All connectors are allowed by current restrictions.",
      remediation: hasBlockedConnector
        ? "Remove restricted connectors or replace with approved connectors."
        : "No remediation required.",
      order: 70,
    };
  },
};
