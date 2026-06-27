import { buildChangeApprovalGates, evaluateChangeApprovalReadiness } from "./change-approval-gates"
import { buildDeploymentGates, evaluateDeploymentReadiness } from "./deployment-gates"
import {
  buildEnterpriseEnvironments,
  evaluateEnvironmentSafety,
} from "./environment-model"
import {
  buildEnvironmentPromotionPaths,
  evaluateEnvironmentPromotionSafety,
} from "./environment-promotion"
import {
  buildEnterpriseReleasePolicies,
  evaluateReleasePolicyReadiness,
} from "./enterprise-release-policy"
import {
  buildEnterpriseProductionBlockers,
  evaluateProductionBlockers,
} from "./production-blockers"
import { buildPromotionCriteria, evaluatePromotionReadiness } from "./promotion-criteria"
import { buildReleaseBoardSeats, evaluateReleaseGovernance } from "./release-board"
import { buildEnterpriseReleaseTiers, evaluateReleaseTierReadiness } from "./release-tier"

export function buildEnterpriseReleaseReadiness() {
  const deploymentGates = buildDeploymentGates()
  const promotionCriteria = buildPromotionCriteria()
  const releaseBoard = buildReleaseBoardSeats()
  const environments = buildEnterpriseEnvironments()
  const promotionPaths = buildEnvironmentPromotionPaths()
  const releasePolicies = buildEnterpriseReleasePolicies()
  const changeApprovalGates = buildChangeApprovalGates()
  const productionBlockers = buildEnterpriseProductionBlockers()
  const releaseTiers = buildEnterpriseReleaseTiers()

  const deploymentReadiness = evaluateDeploymentReadiness(deploymentGates)
  const promotionReadiness = evaluatePromotionReadiness(promotionCriteria)
  const releaseGovernance = evaluateReleaseGovernance(releaseBoard)
  const environmentSafety = evaluateEnvironmentSafety(environments)
  const environmentPromotion = evaluateEnvironmentPromotionSafety(promotionPaths)
  const releasePolicy = evaluateReleasePolicyReadiness(releasePolicies)
  const changeApprovalReadiness = evaluateChangeApprovalReadiness(changeApprovalGates)
  const blockerReadiness = evaluateProductionBlockers(productionBlockers)
  const releaseTierReadiness = evaluateReleaseTierReadiness(releaseTiers)

  const deploymentScore = deploymentReadiness.score
  const promotionScore = promotionReadiness.score
  const releaseScore = Math.round(
    [releaseGovernance.score, releasePolicy.score, releaseTierReadiness.score, blockerReadiness.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 4
  )
  const environmentScore = Math.round(
    [environmentSafety.score, environmentPromotion.score].reduce((sum, score) => sum + score, 0) / 2
  )
  const enterpriseReleaseScore = Math.round(
    [deploymentScore, promotionScore, releaseScore, environmentScore, changeApprovalReadiness.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 5
  )

  return {
    ok: true,
    readOnly: true,
    previewOnly: true,
    persistence: false,
    writesToPrisma: false,
    databaseWrites: false,
    schemaChanges: false,
    migrations: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authIntegration: false,
    providerInstallation: false,
    telemetryBackend: false,
    sessions: false,
    jwt: false,
    deploymentScore,
    promotionScore,
    releaseScore,
    environmentScore,
    enterpriseReleaseScore,
    deploymentReadiness: deploymentScore,
    promotionReadiness: promotionScore,
    releaseGovernance: releaseGovernance.score,
    environmentSafety: environmentScore,
    changeApprovalReadiness: changeApprovalReadiness.score,
    recommendedEA8:
      "EA-8 should define enterprise alpha closure, merge readiness, and main-branch promotion audit without enabling execution.",
    deploymentGates,
    promotionCriteria,
    releaseBoard,
    environments,
    promotionPaths,
    releasePolicies,
    changeApprovalGates,
    productionBlockers,
    releaseTiers,
    evaluations: {
      deploymentReadiness,
      promotionReadiness,
      releaseGovernance,
      environmentSafety,
      environmentPromotion,
      releasePolicy,
      changeApprovalReadiness,
      blockerReadiness,
      releaseTierReadiness,
    },
  }
}

