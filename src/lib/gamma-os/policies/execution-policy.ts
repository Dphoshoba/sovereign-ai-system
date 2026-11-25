import type { PolicyEvaluator } from "./policy-types";

export const previewOnlyPolicy: PolicyEvaluator = {
  id: "preview-only-enforcement",
  category: "execution",
  order: 40,
  evaluate(input) {
    const previewOnly = input.context.requestedMode !== "preview";
    return {
      policyId: "preview-only-enforcement",
      category: "execution",
      severity: previewOnly ? "critical" : "info",
      blocking: previewOnly,
      passed: !previewOnly,
      reason: previewOnly
        ? "Preview-only enforcement active: non-preview execution requested."
        : "Preview mode requested and allowed.",
      remediation: previewOnly
        ? "Switch request mode to preview."
        : "No remediation required.",
      order: 40,
      flags: {
        previewOnly: true,
      },
    };
  },
};

export const liveExecutionDefaultDenyPolicy: PolicyEvaluator = {
  id: "live-execution-default-deny",
  category: "execution",
  order: 50,
  evaluate(input) {
    const liveRequested = input.context.requestedMode === "live";
    return {
      policyId: "live-execution-default-deny",
      category: "execution",
      severity: liveRequested ? "critical" : "info",
      blocking: liveRequested,
      passed: !liveRequested,
      reason: liveRequested
        ? "Live execution is blocked by default."
        : "Live execution not requested.",
      remediation: liveRequested
        ? "Use preview mode and obtain explicit future policy allowance."
        : "No remediation required.",
      order: 50,
      flags: {
        liveExecutionDenied: liveRequested,
        previewOnly: true,
      },
    };
  },
};

export const autonomousPublishingProhibitedPolicy: PolicyEvaluator = {
  id: "autonomous-publishing-prohibited",
  category: "execution",
  order: 60,
  evaluate(input) {
    const publishingRequested = input.context.autonomousPublishingRequested;
    return {
      policyId: "autonomous-publishing-prohibited",
      category: "execution",
      severity: publishingRequested ? "critical" : "info",
      blocking: publishingRequested,
      passed: !publishingRequested,
      reason: publishingRequested
        ? "Autonomous publishing is prohibited."
        : "Autonomous publishing not requested.",
      remediation: publishingRequested
        ? "Disable autonomous publishing and route through approved human-governed flow."
        : "No remediation required.",
      order: 60,
      flags: {
        autonomousPublishingDenied: publishingRequested,
      },
    };
  },
};
