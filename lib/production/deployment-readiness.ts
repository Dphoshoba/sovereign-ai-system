import { buildApiAudit } from "./api-audit"
import { buildEnvironmentAudit } from "./environment-audit"
import { buildSecurityAudit } from "./security-audit"

export type DeploymentReadinessStatus = "READY" | "PARTIAL" | "BLOCKED"

export type DeploymentReadiness = {
  ok: true
  readOnly: true
  writesToPrisma: false
  deploymentScore: number
  status: DeploymentReadinessStatus
  requiredEnvReady: boolean
  healthEndpointsReady: boolean
  readinessEndpointsReady: boolean
  productionConfigurationReady: boolean
  startupValidationReady: boolean
  releaseBlockers: string[]
  recommendedFixes: string[]
}

export function buildDeploymentReadiness(): DeploymentReadiness {
  const environment = buildEnvironmentAudit()
  const api = buildApiAudit()
  const security = buildSecurityAudit()
  const requiredEnvReady = environment.releaseBlockers.length === 0
  const healthEndpointsReady = true
  const readinessEndpointsReady = true
  const productionConfigurationReady =
    requiredEnvReady && security.securityScore >= 75
  const startupValidationReady = false
  const scores = [
    environment.environmentScore,
    api.apiConsistencyScore,
    security.securityScore,
    healthEndpointsReady ? 100 : 0,
    readinessEndpointsReady ? 100 : 0,
    productionConfigurationReady ? 85 : 60,
    startupValidationReady ? 90 : 55,
  ]
  const deploymentScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  )
  const releaseBlockers = [
    ...environment.releaseBlockers,
    "Startup validation is documented but not yet enforced as a production boot gate.",
    "Operator authentication, authorization, and rate limiting must be completed before production execution controls.",
  ]

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    deploymentScore,
    status: releaseBlockers.length > 0 ? "BLOCKED" : "READY",
    requiredEnvReady,
    healthEndpointsReady,
    readinessEndpointsReady,
    productionConfigurationReady,
    startupValidationReady,
    releaseBlockers,
    recommendedFixes: [
      "Add production startup validation for required environment variables.",
      "Keep /api/production/readiness available as the RC-1 readiness endpoint.",
      "Document Vercel environment parity before release.",
      "Add monitoring and alerting before enabling operator execution.",
    ],
  }
}
