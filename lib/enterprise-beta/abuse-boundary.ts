export type AbuseBoundary = {
  id: string
  name: string
  signal: string
  riskTier: "MEDIUM" | "HIGH" | "CRITICAL"
  recommendedResponse: "COOLDOWN" | "REVIEW" | "BLOCK_RUNTIME"
  runtimeActive: false
}

export function buildAbuseBoundaries(): AbuseBoundary[] {
  return [
    {
      id: "abuse-rapid-intent-creation",
      name: "Rapid intent package creation",
      signal: "Many intent packages created by one actor inside a short window.",
      riskTier: "HIGH",
      recommendedResponse: "REVIEW",
      runtimeActive: false,
    },
    {
      id: "abuse-cross-tenant-probing",
      name: "Cross-tenant probing",
      signal: "Repeated requests for organization or workspace scopes outside the actor context.",
      riskTier: "CRITICAL",
      recommendedResponse: "BLOCK_RUNTIME",
      runtimeActive: false,
    },
    {
      id: "abuse-publishing-pressure",
      name: "Publishing pressure",
      signal: "Repeated publication-preparation attempts without approval context.",
      riskTier: "CRITICAL",
      recommendedResponse: "BLOCK_RUNTIME",
      runtimeActive: false,
    },
    {
      id: "abuse-preview-scraping",
      name: "Preview route scraping",
      signal: "High-volume preview route reads with low operator purpose.",
      riskTier: "MEDIUM",
      recommendedResponse: "COOLDOWN",
      runtimeActive: false,
    },
  ]
}

export function evaluateAbuseCoverage(boundaries: AbuseBoundary[] = buildAbuseBoundaries()) {
  const critical = boundaries.filter((boundary) => boundary.riskTier === "CRITICAL").length
  const responses = new Set(boundaries.map((boundary) => boundary.recommendedResponse)).size

  return {
    score: Math.round((boundaries.length / 4) * 62 + critical * 8 + responses * 4),
    status: "ABUSE_BOUNDARIES_DEFINED_NOT_ACTIVE" as const,
    boundaryCount: boundaries.length,
    runtimeActive: false,
  }
}
