import { buildAuthProviderEvaluation } from "./auth-provider-evaluation"
import { buildAuthorizationEnforcementPlan } from "./authorization-enforcement"
import { buildRateLimitEnforcementPlan } from "./rate-limit-enforcement"
import { buildStartupEnforcementPlan } from "./startup-enforcement"
import { buildTelemetryStrategy } from "./telemetry-strategy"

export type EnablementReadiness = {
  ok: true
  readOnly: true
  writesToPrisma: false
  execution: false
  publishing: false
  graphWrites: false
  graphDeletes: false
  openAiCalls: false
  authProviderIntegrated: false
  sessions: false
  jwt: false
  enablementScore: number
  providerRecommendation: string
  authorizationRecommendation: string
  rateLimitRecommendation: string
  telemetryRecommendation: string
  startupGateRecommendation: string
  executionReadiness: "BLOCKED"
  remainingRisks: string[]
  recommendedImplementationOrder: string[]
  evaluations: {
    auth: ReturnType<typeof buildAuthProviderEvaluation>
    authorization: ReturnType<typeof buildAuthorizationEnforcementPlan>
    rateLimit: ReturnType<typeof buildRateLimitEnforcementPlan>
    telemetry: ReturnType<typeof buildTelemetryStrategy>
    startup: ReturnType<typeof buildStartupEnforcementPlan>
  }
}

export function buildProductionEnablementReadiness(): EnablementReadiness {
  const auth = buildAuthProviderEvaluation()
  const authorization = buildAuthorizationEnforcementPlan()
  const rateLimit = buildRateLimitEnforcementPlan()
  const telemetry = buildTelemetryStrategy()
  const startup = buildStartupEnforcementPlan()
  const enablementScore = Math.round(
    [
      topProviderScore(auth),
      authorization.authorizationReadiness,
      rateLimit.rateLimitReadiness,
      telemetry.telemetryReadiness,
      startup.startupReadiness,
    ].reduce((sum, score) => sum + score, 0) / 5
  )

  return {
    ok: true,
    readOnly: true,
    writesToPrisma: false,
    execution: false,
    publishing: false,
    graphWrites: false,
    graphDeletes: false,
    openAiCalls: false,
    authProviderIntegrated: false,
    sessions: false,
    jwt: false,
    enablementScore,
    providerRecommendation: auth.recommendationSummary,
    authorizationRecommendation: authorization.authorizationRecommendation,
    rateLimitRecommendation: rateLimit.rateLimitRecommendation,
    telemetryRecommendation: telemetry.telemetryRecommendation,
    startupGateRecommendation: startup.startupGateRecommendation,
    executionReadiness: "BLOCKED",
    remainingRisks: [
      "Provider selection is not approved or integrated.",
      "Authorization contracts are not enforced at route boundaries.",
      "Rate-limit policies are not implemented.",
      "Telemetry persistence and redaction policy are not implemented.",
      "Startup gate remains report-only.",
      "Publishing and social posting negative tests remain required before execution controls.",
    ],
    recommendedImplementationOrder: [
      "Approve auth provider and identity-to-operator mapping.",
      "Add provider-neutral authorization guard in report-only mode.",
      "Add rate-limit middleware in report-only mode.",
      "Add telemetry persistence for guardrail and approval boundary events.",
      "Add startup gate dry-run checks to deployment validation.",
      "Convert publishing/social/graph guardrails into automated non-mutating tests.",
      "Request separate approval before any blocking enforcement or execution control.",
    ],
    evaluations: {
      auth,
      authorization,
      rateLimit,
      telemetry,
      startup,
    },
  }
}

function topProviderScore(report: ReturnType<typeof buildAuthProviderEvaluation>) {
  return Math.max(...report.options.map((option) => option.score))
}
