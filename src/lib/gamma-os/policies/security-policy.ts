import type { PolicyEvaluator } from "./policy-types";

const RESTRICTED_CAPABILITY_TAGS = new Set<string>([
  "unsafe",
  "high-risk-exfiltration",
]);

export const securityPolicy: PolicyEvaluator = {
  id: "security-policy",
  category: "security",
  order: 90,
  evaluate(input) {
    const requested = input.context.requestedCapabilities;
    const deniedCapability = requested.find((capabilityId) =>
      RESTRICTED_CAPABILITY_TAGS.has(capabilityId)
    );

    const denied = Boolean(deniedCapability);

    return {
      policyId: "security-policy",
      category: "security",
      severity: denied ? "critical" : "info",
      blocking: denied,
      passed: !denied,
      reason: denied
        ? `Security policy denied restricted capability: ${deniedCapability}`
        : "Security policy checks passed.",
      remediation: denied
        ? "Remove restricted capability from request or obtain security exception."
        : "No remediation required.",
      order: 90,
    };
  },
};
