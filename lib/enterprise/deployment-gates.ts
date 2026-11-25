export type DeploymentGate = {
  id: string
  name: string
  requiredFor: "preview" | "staging" | "production"
  gateMode: "preview-only"
  requiredEvidence: string[]
  blocksProduction: boolean
  executionAllowed: false
}

export function buildDeploymentGates(): DeploymentGate[] {
  return [
    {
      id: "build-smoke-gate",
      name: "Build and Smoke Gate",
      requiredFor: "preview",
      gateMode: "preview-only",
      requiredEvidence: ["npm.cmd run build", "npm.cmd run smoke:v1"],
      blocksProduction: true,
      executionAllowed: false,
    },
    {
      id: "enterprise-guard-gate",
      name: "Enterprise Guard Gate",
      requiredFor: "staging",
      gateMode: "preview-only",
      requiredEvidence: ["guard coverage", "tenant isolation", "cross tenant risk"],
      blocksProduction: true,
      executionAllowed: false,
    },
    {
      id: "auth-enforcement-gate",
      name: "Authentication Enforcement Gate",
      requiredFor: "production",
      gateMode: "preview-only",
      requiredEvidence: ["auth provider", "sessions decision", "authorization guards"],
      blocksProduction: true,
      executionAllowed: false,
    },
    {
      id: "observability-gate",
      name: "Observability Gate",
      requiredFor: "production",
      gateMode: "preview-only",
      requiredEvidence: ["telemetry backend", "audit persistence", "redaction policy"],
      blocksProduction: true,
      executionAllowed: false,
    },
  ]
}

export function evaluateDeploymentReadiness(gates: DeploymentGate[] = buildDeploymentGates()) {
  const allPreviewOnly = gates.every((gate) => gate.gateMode === "preview-only")
  const allNonExecuting = gates.every((gate) => gate.executionAllowed === false)
  const productionBlocked = gates.some(
    (gate) => gate.requiredFor === "production" && gate.blocksProduction
  )
  const allHaveEvidence = gates.every((gate) => gate.requiredEvidence.length > 0)
  const checks = [allPreviewOnly, allNonExecuting, productionBlocked, allHaveEvidence]

  return {
    score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    status: "DEPLOYMENT_GATES_PREVIEW_READY" as const,
    gateCount: gates.length,
    productionBlocked,
  }
}

