export type RateLimitPolicyId =
  | "preview-routes"
  | "operator-intent"
  | "review-package-creation"
  | "research-missions"
  | "content-orchestration"
  | "ontology-readiness"
  | "graph-transaction-test-write"
  | "future-execution"

export type RateLimitRisk = "low" | "medium" | "high" | "critical"

export type RateLimitPolicy = {
  id: RateLimitPolicyId
  appliesTo: string[]
  recommendedLimit: string
  burstLimit: string
  escalationThreshold: string
  riskClassification: RateLimitRisk
  enforcementStatus: "defined-not-enforced"
  notes: string[]
}

export const RATE_LIMIT_POLICIES: RateLimitPolicy[] = [
  policy("preview-routes", ["/api/ev-kos/operator-actions/preview", "/api/content/*", "/api/ontology/*"], "60 requests/minute/operator", "120 requests/5 minutes/operator", "3 bursts in 15 minutes", "medium", [
    "Preview routes do not execute actions but may perform expensive planning.",
  ]),
  policy("operator-intent", ["/api/ev-kos/operator-intent"], "12 POST requests/hour/operator", "20 POST requests/day/operator", "3 failed attempts in 10 minutes", "high", [
    "Creates pending ExecutionAuthorizationRequest intent packages only.",
  ]),
  policy("review-package-creation", ["/api/ontology/ingestion-review-queue/create-package"], "10 POST requests/hour/operator", "25 POST requests/day/operator", "2 malformed requests in 10 minutes", "high", [
    "Creates pending review packages only; no graph writes.",
  ]),
  policy("research-missions", ["/api/research/missions", "/api/research/missions/discover"], "30 requests/hour/operator", "80 requests/day/operator", "5 dry-run failures in 30 minutes", "medium", [
    "Mission endpoints remain dry-run and should not collect live trend data automatically.",
  ]),
  policy("content-orchestration", ["/api/content/orchestrator"], "30 requests/hour/operator", "80 requests/day/operator", "5 blocked publish attempts/day", "medium", [
    "Blocks publish, social posting, and approval attempts.",
  ]),
  policy("ontology-readiness", ["/api/ontology/graph-write-readiness", "/api/ontology/semantic-graph-ingestion"], "60 requests/hour/operator", "150 requests/day/operator", "5 validation failures in 30 minutes", "medium", [
    "Readiness and dry-run routes should remain read-only.",
  ]),
  policy("graph-transaction-test-write", ["/api/ontology/semantic-graph-transaction"], "3 explicit test-write attempts/day/administrator", "1 active test-write request at a time", "1 failed write gate attempt", "critical", [
    "Must remain behind explicit-test-write, explicitWriteEnabled, tenant, actor, and governance gates.",
  ]),
  policy("future-execution", ["future execution routes"], "0 until RC approval", "0 until RC approval", "Any execution request before approval", "critical", [
    "No operator actions become executable in RC-2.",
  ]),
]

export function listRateLimitPolicies() {
  return RATE_LIMIT_POLICIES
}

export function getRateLimitPolicy(id: string) {
  return RATE_LIMIT_POLICIES.find((policyItem) => policyItem.id === id) ?? null
}

export function summarizeRateLimitPolicies() {
  return {
    total: RATE_LIMIT_POLICIES.length,
    enforcementStatus: "defined-not-enforced" as const,
    critical: RATE_LIMIT_POLICIES.filter(
      (policyItem) => policyItem.riskClassification === "critical"
    ).length,
    high: RATE_LIMIT_POLICIES.filter(
      (policyItem) => policyItem.riskClassification === "high"
    ).length,
  }
}

function policy(
  id: RateLimitPolicyId,
  appliesTo: string[],
  recommendedLimit: string,
  burstLimit: string,
  escalationThreshold: string,
  riskClassification: RateLimitRisk,
  notes: string[]
): RateLimitPolicy {
  return {
    id,
    appliesTo,
    recommendedLimit,
    burstLimit,
    escalationThreshold,
    riskClassification,
    enforcementStatus: "defined-not-enforced",
    notes,
  }
}
