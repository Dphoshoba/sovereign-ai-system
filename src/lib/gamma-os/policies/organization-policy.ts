import type { PolicyEvaluator } from "./policy-types";

const DENIED_ENVIRONMENTS = new Set<string>(["forbidden"]);

export const organizationPolicy: PolicyEvaluator = {
  id: "organization-policy",
  category: "organization",
  order: 80,
  evaluate(input) {
    const organization = input.context.organization;
    const denied =
      !organization.tenantId ||
      !organization.organizationId ||
      DENIED_ENVIRONMENTS.has(organization.environment);

    return {
      policyId: "organization-policy",
      category: "organization",
      severity: denied ? "critical" : "info",
      blocking: denied,
      passed: !denied,
      reason: denied
        ? "Organization policy denied due to invalid tenant/org context."
        : "Organization context satisfies policy requirements.",
      remediation: denied
        ? "Provide valid tenant and organization context aligned to allowed environment."
        : "No remediation required.",
      order: 80,
    };
  },
};
