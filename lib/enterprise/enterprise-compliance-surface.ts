export type EnterpriseComplianceControl = {
  id: string
  family: "access" | "tenant-isolation" | "audit" | "data-boundary" | "publishing" | "ai-safety"
  name: string
  readiness: "contract-ready" | "planned" | "blocked"
  blockedCapabilities: string[]
}

export function buildEnterpriseComplianceSurface(): EnterpriseComplianceControl[] {
  return [
    {
      id: "access-control-contract",
      family: "access",
      name: "Access control contract",
      readiness: "planned",
      blockedCapabilities: ["auth integration", "sessions", "JWT"],
    },
    {
      id: "tenant-isolation-contract",
      family: "tenant-isolation",
      name: "Tenant isolation contract",
      readiness: "contract-ready",
      blockedCapabilities: ["cross-tenant writes", "cross-workspace writes"],
    },
    {
      id: "audit-evidence-contract",
      family: "audit",
      name: "Audit evidence contract",
      readiness: "contract-ready",
      blockedCapabilities: ["audit persistence", "telemetry backend"],
    },
    {
      id: "data-boundary-contract",
      family: "data-boundary",
      name: "Data boundary contract",
      readiness: "contract-ready",
      blockedCapabilities: ["database writes", "graph writes"],
    },
    {
      id: "publishing-block",
      family: "publishing",
      name: "Publishing remains blocked",
      readiness: "blocked",
      blockedCapabilities: ["publishing", "social posting", "email sending"],
    },
    {
      id: "ai-safety-block",
      family: "ai-safety",
      name: "AI generation remains blocked",
      readiness: "blocked",
      blockedCapabilities: ["OpenAI calls", "draft generation", "autonomous generation"],
    },
  ]
}

export function evaluateComplianceReadiness(
  controls: EnterpriseComplianceControl[] = buildEnterpriseComplianceSurface()
) {
  const contractReady = controls.filter((control) => control.readiness === "contract-ready").length
  const planned = controls.filter((control) => control.readiness === "planned").length
  const score = Math.round(((contractReady + planned * 0.5) / controls.length) * 100)

  return {
    score,
    status: "COMPLIANCE_SURFACE_DEFINED_NOT_ENFORCED" as const,
    controlCount: controls.length,
    contractReady,
    blocked: controls.filter((control) => control.readiness === "blocked").length,
  }
}

