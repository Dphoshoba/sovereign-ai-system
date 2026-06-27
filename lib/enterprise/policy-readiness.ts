import { buildChangeControlReadiness } from "./change-control"
import {
  buildExceptionWorkflowSteps,
  evaluateExceptionWorkflowReadiness,
} from "./exception-workflow"
import {
  buildGovernanceEvolutionSignals,
  evaluateGovernanceEvolutionReadiness,
} from "./governance-evolution"
import { buildPolicyChangeRequests, evaluateChangeRequestCoverage } from "./policy-change-request"
import { buildPolicyDriftSignals, evaluatePolicyDriftReadiness } from "./policy-drift"
import { buildPolicyExceptions, evaluateExceptionCoverage } from "./policy-exception"
import { buildPolicyImpactAnalyses, evaluateImpactReadiness } from "./policy-impact-analysis"
import { buildPolicyReviewBoard, evaluatePolicyReviewReadiness } from "./policy-review-board"
import { buildPolicyVersions, evaluatePolicyVersionReadiness } from "./policy-versioning"

export function buildEnterprisePolicyReadiness() {
  const versions = buildPolicyVersions()
  const changeRequests = buildPolicyChangeRequests()
  const reviewBoard = buildPolicyReviewBoard()
  const exceptions = buildPolicyExceptions()
  const driftSignals = buildPolicyDriftSignals()
  const impactAnalyses = buildPolicyImpactAnalyses()
  const exceptionWorkflow = buildExceptionWorkflowSteps()
  const governanceSignals = buildGovernanceEvolutionSignals()

  const policyVersionReadiness = evaluatePolicyVersionReadiness(versions)
  const changeRequestCoverage = evaluateChangeRequestCoverage(changeRequests)
  const policyReviewReadiness = evaluatePolicyReviewReadiness(reviewBoard)
  const exceptionCoverage = evaluateExceptionCoverage(exceptions)
  const exceptionWorkflowReadiness = evaluateExceptionWorkflowReadiness(exceptionWorkflow)
  const policyDriftReadiness = evaluatePolicyDriftReadiness(driftSignals)
  const impactReadiness = evaluateImpactReadiness(impactAnalyses)
  const changeControl = buildChangeControlReadiness()
  const governanceEvolution = evaluateGovernanceEvolutionReadiness(governanceSignals)

  const policyCoverage = Math.round(
    [policyVersionReadiness.score, policyReviewReadiness.score, impactReadiness.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 3
  )
  const exceptionReadiness = Math.round(
    [exceptionCoverage.score, exceptionWorkflowReadiness.score].reduce(
      (sum, score) => sum + score,
      0
    ) / 2
  )
  const policyGovernanceScore = Math.round(
    [
      policyCoverage,
      changeControl.score,
      exceptionReadiness,
      policyDriftReadiness.score,
      governanceEvolution.score,
    ].reduce((sum, score) => sum + score, 0) / 5
  )
  const enterpriseControlScore = policyGovernanceScore

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
    policyReadiness: policyCoverage,
    changeControlReadiness: changeControl.score,
    exceptionReadiness,
    policyGovernanceScore,
    enterpriseControlScore,
    policyCoverage,
    changeControlCoverage: changeControl.score,
    exceptionCoverage: exceptionReadiness,
    policyVersionReadiness: policyVersionReadiness.score,
    policyDriftReadiness: policyDriftReadiness.score,
    governanceEvolutionReadiness: governanceEvolution.score,
    recommendedEA7:
      "EA-7 should define enterprise deployment gates and production promotion criteria in preview mode without persistence or execution.",
    versions,
    changeRequests,
    reviewBoard,
    exceptions,
    driftSignals,
    impactAnalyses,
    exceptionWorkflow,
    governanceSignals,
    evaluations: {
      policyVersionReadiness,
      changeRequestCoverage,
      policyReviewReadiness,
      exceptionCoverage,
      exceptionWorkflowReadiness,
      policyDriftReadiness,
      impactReadiness,
      changeControl,
      governanceEvolution,
    },
  }
}

