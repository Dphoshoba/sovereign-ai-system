import { buildApiAudit } from "./api-audit"
import { buildDeploymentReadiness } from "./deployment-readiness"
import { buildEnvironmentAudit } from "./environment-audit"
import { buildSecurityAudit } from "./security-audit"

export type ProductionReadinessStatus = "READY" | "PARTIAL" | "BLOCKED"

export type ProductionReadinessAudit = {
  ok: true
  readOnly: true
  writesToPrisma: false
  actionExecution: false
  openAiCalls: false
  graphWrites: false
  graphDeletes: false
  publishing: false
  socialPosting: false
  automaticApprovals: false
  productionReadinessScore: number
  securityScore: number
  deploymentScore: number
  apiConsistencyScore: number
  governanceScore: number
  status: ProductionReadinessStatus
  highestRiskFindings: string[]
  recommendedFixes: string[]
  releaseBlockers: string[]
  audits: {
    environment: ReturnType<typeof buildEnvironmentAudit>
    security: ReturnType<typeof buildSecurityAudit>
    api: ReturnType<typeof buildApiAudit>
    deployment: ReturnType<typeof buildDeploymentReadiness>
  }
}

export function buildProductionReadinessAudit(): ProductionReadinessAudit {
  const environment = buildEnvironmentAudit()
  const security = buildSecurityAudit()
  const api = buildApiAudit()
  const deployment = buildDeploymentReadiness()
  const governanceScore = 90
  const releaseBlockers = unique([
    ...security.releaseBlockers,
    ...deployment.releaseBlockers,
  ])
  const productionReadinessScore = Math.round(
    [
      environment.environmentScore,
      security.securityScore,
      api.apiConsistencyScore,
      deployment.deploymentScore,
      governanceScore,
    ].reduce((sum, score) => sum + score, 0) / 5
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    actionExecution: false,
    openAiCalls: false,
    graphWrites: false,
    graphDeletes: false,
    publishing: false,
    socialPosting: false,
    automaticApprovals: false,
    productionReadinessScore,
    securityScore: security.securityScore,
    deploymentScore: deployment.deploymentScore,
    apiConsistencyScore: api.apiConsistencyScore,
    governanceScore,
    status: releaseBlockers.length > 0 ? "BLOCKED" : "READY",
    highestRiskFindings: unique([
      ...security.highestRiskFindings,
      ...api.highestRiskFindings,
    ]).slice(0, 12),
    recommendedFixes: unique([
      ...security.recommendedFixes,
      ...api.recommendedFixes,
      ...deployment.recommendedFixes,
    ]),
    releaseBlockers,
    audits: {
      environment,
      security,
      api,
      deployment,
    },
  }
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}
